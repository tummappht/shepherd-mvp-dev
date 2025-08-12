# main.py
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Optional, List, Set
from datetime import datetime
import json

from .ws_manager import WebSocketManager
from .mas_bridge_4 import launch_mas_interactive, create_ws_input_handler
from .models.db import create_repository_analysis, get_repository_analysis, update_analysis_status, list_user_analyses, delete_repository_analysis

app = FastAPI()
ws_manager = WebSocketManager()

# ============= CONCURRENCY CONTROL =============
MAX_CONCURRENT_RUNS = 3  
active_runs: Set[str] = set()  # Track active run_ids
run_queue: asyncio.Queue = asyncio.Queue()  # Queue for waiting runs
run_tasks: Dict[str, asyncio.Task] = {}  # Track background tasks

# Store input queues for each run
input_queues: Dict[str, asyncio.Queue] = {}

class JobRequest(BaseModel):
    github_url: str

class RepositoryAnalysisRequest(BaseModel):
    repository_url: str
    project_description: str
    environment: str  # "local" or "testnet"
    user_id: Optional[str] = None
    reference_files: Optional[List[str]] = None

class RepositoryUpdateRequest(BaseModel):
    repository_url: Optional[str] = None
    project_description: Optional[str] = None
    environment: Optional[str] = None
    reference_files: Optional[List[str]] = None

class QueuePosition(BaseModel):
    position: int
    total_waiting: int
    estimated_wait_minutes: int

# ============= QUEUE PROCESSOR =============
async def process_run_queue():
    """
    Background task that processes the run queue when slots become available
    """
    while True:
        try:
            # Wait for a queued run
            queued_run = await run_queue.get()
            
            # Wait for an available slot
            while len(active_runs) >= MAX_CONCURRENT_RUNS:
                await asyncio.sleep(1)
            
            # Process the queued run
            run_id = queued_run["run_id"]
            job = queued_run["job"]
            
            # Mark as active
            active_runs.add(run_id)
            
            # Update status in database
            update_analysis_status(run_id, "running")
            
            # Notify client that run is starting
            await ws_manager.send_log(run_id, {
                "type": "queue_update",
                "data": {
                    "status": "starting",
                    "message": "Your analysis is now starting!"
                }
            })
            
            # Create input queue for this run
            input_queues[run_id] = asyncio.Queue()
            
            # Create the WebSocket-based input handler
            input_handler = create_ws_input_handler(run_id, input_queues[run_id])
            
            # Launch MAS
            try:
                result = await launch_mas_interactive(
                    run_id=run_id,
                    job=job,
                    input_handler=input_handler,
                    ws_manager=ws_manager,
                    log_dir="./backend/logs"
                )
                
                # Update status based on result
                if result.get("success"):
                    update_analysis_status(run_id, "completed")
                else:
                    update_analysis_status(run_id, "failed", {
                        "error": result.get("error", "Unknown error")
                    })
                    
            except Exception as e:
                print(f"Error running MAS for {run_id}: {e}")
                update_analysis_status(run_id, "failed", {"error": str(e)})
                await ws_manager.send_log(run_id, {
                    "type": "error",
                    "data": f"Analysis failed: {str(e)}"
                })
            finally:
                # Clean up
                active_runs.discard(run_id)
                if run_id in input_queues:
                    del input_queues[run_id]
                if run_id in run_tasks:
                    del run_tasks[run_id]
                    
        except Exception as e:
            print(f"Queue processor error: {e}")
            await asyncio.sleep(1)

# Start the queue processor on app startup
@app.on_event("startup")
async def startup_event():
        # Clear any stuck runs on startup
    global active_runs, run_queue
    active_runs.clear()
    
    # Clear the queue
    while not run_queue.empty():
        try:
            run_queue.get_nowait()
        except asyncio.QueueEmpty:
            break
    
    print("✅ Server started with clean state")
    asyncio.create_task(process_run_queue())

# ============= MODIFIED ENDPOINTS =============

@app.post("/api/repository-analysis")
async def create_repository_analysis_endpoint(request: RepositoryAnalysisRequest):
    """
    Create a new repository analysis request and store in Supabase
    """
    try:
        # Validate environment
        if request.environment not in ["local", "testnet"]:
            raise HTTPException(status_code=400, detail="Environment must be 'local' or 'testnet'")
        
        # Create the analysis record in Supabase with "queued" status
        analysis_record = create_repository_analysis(
            repository_url=request.repository_url,
            project_description=request.project_description,
            environment=request.environment,
            user_id=request.user_id,
            reference_files=request.reference_files
        )
        
        # Update status to queued
        update_analysis_status(analysis_record["run_id"], "queued")
        
        return JSONResponse({
            "success": True,
            "run_id": analysis_record["run_id"],
            "message": "Repository analysis created successfully",
            "data": analysis_record
        }, status_code=201)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create repository analysis: {str(e)}")

import asyncio
from asyncio import Lock

# Add this with your other global variables (after line 23)
queue_lock = Lock()  # Prevent race conditions in queue operations

# Replace your existing start_run function with this fixed version:
@app.post("/runs/{run_id}")
async def start_run(run_id: str, job: JobRequest, tasks: BackgroundTasks):
    """
    Queue a MAS run. If slots available, starts immediately. Otherwise queues it.
    """
    
    # Use lock to prevent race conditions
    async with queue_lock:
        # Check if this run is already active or queued
        if run_id in active_runs:
            return JSONResponse({
                "status": "already_running",
                "run_id": run_id,
                "message": "This analysis is already running"
            }, status_code=200)
        
        # Check if already in queue
        queue_items = []
        already_queued = False
        while not run_queue.empty():
            try:
                item = run_queue.get_nowait()
                queue_items.append(item)
                if item["run_id"] == run_id:
                    already_queued = True
            except asyncio.QueueEmpty:
                break
        
        # Restore queue
        for item in queue_items:
            await run_queue.put(item)
        
        if already_queued:
            return JSONResponse({
                "status": "already_queued",
                "run_id": run_id,
                "message": "This analysis is already in the queue"
            }, status_code=200)
        
        # Check if we have available slots
        if len(active_runs) < MAX_CONCURRENT_RUNS:
            # Start immediately
            active_runs.add(run_id)
            
            # Update status in database
            update_analysis_status(run_id, "running")
            
            # Create input queue for this run
            input_queues[run_id] = asyncio.Queue()
            
            # Create the WebSocket-based input handler
            input_handler = create_ws_input_handler(run_id, input_queues[run_id])
            
            # Start MAS in background
            async def run_and_cleanup():
                try:
                    result = await launch_mas_interactive(
                        run_id=run_id,
                        job=job.dict(),
                        input_handler=input_handler,
                        ws_manager=ws_manager,
                        log_dir="./backend/logs"
                    )
                    
                    # Update status based on result
                    if result.get("success"):
                        update_analysis_status(run_id, "completed")
                    else:
                        update_analysis_status(run_id, "failed", {
                            "error": result.get("error", "Unknown error")
                        })
                finally:
                    # Clean up
                    active_runs.discard(run_id)
                    if run_id in input_queues:
                        del input_queues[run_id]
                    if run_id in run_tasks:
                        del run_tasks[run_id]
            
            # Create and track the task
            task = asyncio.create_task(run_and_cleanup())
            run_tasks[run_id] = task
            
            return JSONResponse({
                "status": "started",
                "run_id": run_id,
                "active_runs": len(active_runs),
                "max_concurrent": MAX_CONCURRENT_RUNS
            }, status_code=202)
        
        else:
            # Add to queue - calculate position BEFORE adding
            current_queue_size = run_queue.qsize()
            queue_position = current_queue_size + 1  # This run will be at position N+1
            
            queue_item = {
                "run_id": run_id,
                "job": job.dict(),
                "queued_at": datetime.utcnow().isoformat(),
                "position": queue_position  # Store position in the item
            }
            
            await run_queue.put(queue_item)
            
            # Update status in database
            update_analysis_status(run_id, "queued", {
                "queue_position": queue_position
            })
            
            # Calculate estimated wait
            estimated_wait = queue_position * 15
            
            # Send queue notification via WebSocket
            await ws_manager.send_log(run_id, {
                "type": "queued",
                "data": {
                    "position": queue_position,
                    "total_waiting": queue_position,
                    "estimated_wait_minutes": estimated_wait,
                    "message": f"Your analysis is queued. Position: {queue_position}"
                }
            })
            
            return JSONResponse({
                "status": "queued",
                "run_id": run_id,
                "queue_position": queue_position,
                "estimated_wait_minutes": estimated_wait,
                "message": "Server at capacity. Your analysis has been queued."
            }, status_code=202)

# Also update the get_queue_status function to be more accurate:
@app.get("/runs/{run_id}/queue-status")
async def get_queue_status(run_id: str):
    """
    Get the current queue status for a run
    """
    async with queue_lock:
        if run_id in active_runs:
            return JSONResponse({
                "run_id": run_id,
                "status": "running",
                "active_runs": len(active_runs),
                "max_concurrent": MAX_CONCURRENT_RUNS
            })
        
        # Check if it's in the queue
        queue_items = []
        position = 0
        found = False
        
        # Drain queue to check position (then restore it)
        while not run_queue.empty():
            try:
                item = run_queue.get_nowait()
                queue_items.append(item)
                if item["run_id"] == run_id:
                    position = len(queue_items)
                    found = True
            except asyncio.QueueEmpty:
                break
        
        # Restore queue
        for item in queue_items:
            await run_queue.put(item)
        
        if found:
            estimated_wait = position * 15  # 15 minutes per run estimate
            return JSONResponse({
                "run_id": run_id,
                "status": "queued",
                "queue_position": position,
                "total_waiting": len(queue_items),
                "estimated_wait_minutes": estimated_wait,
                "active_runs": len(active_runs),
                "max_concurrent": MAX_CONCURRENT_RUNS
            })
        
        return JSONResponse({
            "run_id": run_id,
            "status": "not_found",
            "message": "Run not found in active or queued runs"
        }, status_code=404)

@app.get("/system/status")
async def get_system_status():
    """
    Get overall system status including active runs and queue size
    """
    queue_size = run_queue.qsize()
    
    return JSONResponse({
        "active_runs": len(active_runs),
        "max_concurrent": MAX_CONCURRENT_RUNS,
        "queued_runs": queue_size,
        "total_load": len(active_runs) + queue_size,
        "available_slots": max(0, MAX_CONCURRENT_RUNS - len(active_runs)),
        "status": "busy" if len(active_runs) >= MAX_CONCURRENT_RUNS else "available"
    })

# Update the cancel_run function to also use the lock:
@app.delete("/runs/{run_id}/cancel")
async def cancel_run(run_id: str):
    """Cancel a running or queued analysis"""
    
    async with queue_lock:
        # Check if it's running
        if run_id in active_runs:
            # Cancel the task if it exists
            if run_id in run_tasks:
                run_tasks[run_id].cancel()
            
            # Clean up
            active_runs.discard(run_id)
            if run_id in input_queues:
                del input_queues[run_id]
            if run_id in run_tasks:
                del run_tasks[run_id]
            
            # Update database
            update_analysis_status(run_id, "cancelled")
            
            # Notify via WebSocket
            await ws_manager.send_log(run_id, {
                "type": "cancelled",
                "data": "Analysis has been cancelled"
            })
            
            return JSONResponse({
                "success": True,
                "message": "Analysis cancelled successfully"
            })
        
        # Check if it's in the queue and remove it
        queue_items = []
        found = False
        
        # Drain queue to find and remove the run
        while not run_queue.empty():
            try:
                item = run_queue.get_nowait()
                if item["run_id"] != run_id:
                    queue_items.append(item)
                else:
                    found = True
            except asyncio.QueueEmpty:
                break
        
        # Restore queue without the cancelled item
        for item in queue_items:
            await run_queue.put(item)
        
        if found:
            update_analysis_status(run_id, "cancelled")
            await ws_manager.send_log(run_id, {
                "type": "cancelled",
                "data": "Analysis has been cancelled from queue"
            })
            return JSONResponse({"success": True, "message": "Queued analysis cancelled successfully"})
        
        return JSONResponse({"success": False, "message": "Run not found or not cancellable"}, status_code=404)

# ============= EXISTING ENDPOINTS (unchanged) =============

@app.websocket("/ws/{run_id}")
async def run_logs_ws(ws: WebSocket, run_id: str):
    """
    WebSocket endpoint for bidirectional communication with MAS.
    - Sends MAS output and prompts to client
    - Receives user input from client
    """
    await ws_manager.connect(run_id, ws)
    
    try:
        while True:
            # Wait for messages from client
            data = await ws.receive_text()
            
            try:
                message = json.loads(data)
                
                # Handle input messages from client
                if message.get("type") == "input":
                    user_input = message.get("data", "")
                    
                    # Put input in the queue for MAS to consume
                    if run_id in input_queues:
                        await input_queues[run_id].put(user_input)
                    else:
                        # Send error if run not found
                        await ws.send_json({
                            "type": "error",
                            "data": "Run not found or not ready for input"
                        })
                
                # Handle other message types if needed
                elif message.get("type") == "ping":
                    await ws.send_json({"type": "pong"})
                    
            except json.JSONDecodeError:
                await ws.send_json({
                    "type": "error",
                    "data": "Invalid JSON message"
                })
                
    except WebSocketDisconnect:
        ws_manager.disconnect(run_id, ws)
        # Clean up the input queue if no more connections
        if run_id in input_queues and not ws_manager._conns[run_id]:
            del input_queues[run_id]

@app.get("/runs/{run_id}/status")
async def get_run_status(run_id: str):
    """Check if a run is active and ready for input."""
    is_active = run_id in input_queues
    is_queued = False
    
    # Check if queued
    if not is_active:
        # Check queue (similar to queue-status endpoint)
        temp_items = []
        while not run_queue.empty():
            try:
                item = run_queue.get_nowait()
                temp_items.append(item)
                if item["run_id"] == run_id:
                    is_queued = True
            except asyncio.QueueEmpty:
                break
        
        # Restore queue
        for item in temp_items:
            await run_queue.put(item)
    
    return JSONResponse({
        "run_id": run_id,
        "active": is_active,
        "queued": is_queued,
        "ready_for_input": is_active
    })

@app.get("/api/repository-analysis/{run_id}")
async def get_repository_analysis_endpoint(run_id: str):
    """
    Get a repository analysis by run_id
    """
    try:
        analysis = get_repository_analysis(run_id)
        
        if not analysis:
            raise HTTPException(status_code=404, detail="Repository analysis not found")
        
        return JSONResponse({
            "success": True,
            "data": analysis
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repository analysis: {str(e)}")

@app.get("/api/my-repositories")
async def get_my_repositories(user_id: str = "@0xps", limit: int = 50):
    """
    Get all repository analyses for a user (My Repositories)
    """
    try:
        repositories = list_user_analyses(user_id, limit)
        
        # Format the response to match the UI
        formatted_repos = []
        for repo in repositories:
            # Extract repository name from URL for display
            repo_name = repo["repository_url"].split("/")[-1] if repo["repository_url"] else "Unknown"
            
            formatted_repos.append({
                "run_id": repo["run_id"],
                "repository_url": repo["repository_url"],
                "repository_name": repo_name,
                "environment": repo["environment"],
                "status": repo["status"],
                "created_at": repo["created_at"],
                "updated_at": repo["updated_at"]
            })
        
        return JSONResponse({
            "success": True,
            "data": formatted_repos
        })
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch repositories: {str(e)}")

@app.put("/api/repository-analysis/{run_id}")
async def update_repository_analysis_endpoint(run_id: str, request: RepositoryUpdateRequest):
    """
    Update a repository analysis
    """
    try:
        # Get existing analysis
        existing_analysis = get_repository_analysis(run_id)
        
        if not existing_analysis:
            raise HTTPException(status_code=404, detail="Repository analysis not found")
        
        # Prepare update data
        update_data = {}
        
        if request.repository_url is not None:
            update_data["repository_url"] = request.repository_url
        if request.project_description is not None:
            update_data["project_description"] = request.project_description
        if request.environment is not None:
            if request.environment not in ["local", "testnet"]:
                raise HTTPException(status_code=400, detail="Environment must be 'local' or 'testnet'")
            update_data["environment"] = request.environment
        if request.reference_files is not None:
            update_data["reference_files"] = request.reference_files
        
        # Update the analysis
        update_analysis_status(run_id, existing_analysis["status"], update_data)
        
        # Get updated analysis
        updated_analysis = get_repository_analysis(run_id)
        
        return JSONResponse({
            "success": True,
            "message": "Repository analysis updated successfully",
            "data": updated_analysis
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update repository analysis: {str(e)}")

@app.delete("/api/repository-analysis/{run_id}")
async def delete_repository_analysis_endpoint(run_id: str):
    """
    Delete a repository analysis
    """
    try:
        # Get existing analysis
        existing_analysis = get_repository_analysis(run_id)
        
        if not existing_analysis:
            raise HTTPException(status_code=404, detail="Repository analysis not found")
        
        # Delete from Supabase
        success = delete_repository_analysis(run_id)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete repository analysis")
        
        return JSONResponse({
            "success": True,
            "message": "Repository analysis deleted successfully"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete repository analysis: {str(e)}")

@app.websocket("/echo/{run_id}")
async def _echo(ws: WebSocket, run_id: str):
    """Simple echo endpoint for testing WebSocket connectivity."""
    await ws.accept()
    await ws.send_text(f"hello {run_id}")
    
    try:
        while True:
            data = await ws.receive_text()
            await ws.send_text(f"echo: {data}")
    except WebSocketDisconnect:
        pass

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "shepherd-mvp", "active_runs": len(active_runs), "max_concurrent": MAX_CONCURRENT_RUNS}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)