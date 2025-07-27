# main.py
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from fastapi.routing import APIRoute

from .ws_manager import WebSocketManager
from backend.app.mas_bridge_4 import launch_mas         # same file you already have

app = FastAPI()
ws_manager = WebSocketManager()

class JobRequest(BaseModel):
    github_url: str
    contracts: list[str]
    challenge_name: str

@app.post("/runs/{run_id}")
async def start_run(run_id: str, job: JobRequest, tasks: BackgroundTasks):
    """Kick off MAS in the background and return 202 immediately."""
    tasks.add_task(
        launch_mas,
        run_id=run_id,
        job=job.dict(),
        ws_manager=ws_manager,
        # log_dir="./logs",
        # capture_stderr=True,
    )
    return JSONResponse({"status": "started", "run_id": run_id}, status_code=202)

@app.websocket("/ws/{run_id}")
async def run_logs_ws(ws: WebSocket, run_id: str):
    await ws_manager.connect(run_id, ws)

    try:
        # We don’t expect frames from client; keep connection alive
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(run_id, ws)
        
from fastapi import WebSocket

@app.websocket("/echo/{run_id}")
async def _echo(ws: WebSocket, run_id: str):
    await ws.accept()
    await ws.send_text(f"hello {run_id}")
    await ws.close()


