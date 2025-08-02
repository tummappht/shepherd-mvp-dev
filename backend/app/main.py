# main.py
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict, Optional, List
import json

from .ws_manager import WebSocketManager
from .mas_bridge_4 import launch_mas_interactive, create_ws_input_handler
from .models.db import create_repository_analysis, get_repository_analysis, update_analysis_status, list_user_analyses, delete_repository_analysis

app = FastAPI()
ws_manager = WebSocketManager()

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

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend origin like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],  # <- this is important
    allow_headers=["*"],
)

@app.post("/api/repository-analysis")
async def create_repository_analysis_endpoint(request: RepositoryAnalysisRequest):
    """
    Create a new repository analysis request and store in Supabase
    """
    try:
        # Validate environment
        if request.environment not in ["local", "testnet"]:
            raise HTTPException(status_code=400, detail="Environment must be 'local' or 'testnet'")
        
        # Create the analysis record in Supabase
        analysis_record = create_repository_analysis(
            repository_url=request.repository_url,
            project_description=request.project_description,
            environment=request.environment,
            user_id=request.user_id,
            reference_files=request.reference_files
        )
        
        return JSONResponse({
            "success": True,
            "run_id": analysis_record["run_id"],
            "message": "Repository analysis created successfully",
            "data": analysis_record
        }, status_code=201)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create repository analysis: {str(e)}")

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

@app.post("/runs/{run_id}")
async def start_run(run_id: str, job: JobRequest, tasks: BackgroundTasks):
    """Kick off MAS in the background with WebSocket-based interaction."""
    # Create input queue for this run
    input_queues[run_id] = asyncio.Queue()
    
    # Create the WebSocket-based input handler
    input_handler = create_ws_input_handler(run_id, input_queues[run_id])
    
    # Start MAS in background with the WebSocket handler
    tasks.add_task(
        launch_mas_interactive,
        run_id=run_id,
        job=job.dict(),
        input_handler=input_handler,
        ws_manager=ws_manager,
        log_dir="./backend/logs"
    )
    
    return JSONResponse({"status": "started", "run_id": run_id}, status_code=202)

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
    return JSONResponse({
        "run_id": run_id,
        "active": is_active,
        "ready_for_input": is_active
    })

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
    return {"status": "healthy", "service": "shepherd-mvp"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)