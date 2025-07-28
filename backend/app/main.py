# main.py
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Dict
import json

from .ws_manager import WebSocketManager
from backend.app.mas_bridge import launch_mas_interactive, create_ws_input_handler

app = FastAPI()
ws_manager = WebSocketManager()

# Store input queues for each run
input_queues: Dict[str, asyncio.Queue] = {}

class JobRequest(BaseModel):
    github_url: str


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