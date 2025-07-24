#This is the main file and API / WebSocket entrypoint


from fastapi import FastAPI, WebSocket, BackgroundTasks
from models.job import JobRequest, JobStatus, MASLogLine
from models.db import supabase
from ws_manager import WSManager
from mas_bridge import launch_mas

app = FastAPI()
ws_manager = WSManager()

@app.post("/api/start_run")
async def start_run(request: JobRequest, background_tasks: BackgroundTasks):
    """
    - Save job to Supabase
    - Launch MAS subprocess via mas_bridge.py
    - Attach logs to websocket manager
    - Return run_id to client
    """
    pass  # TODO: implement

@app.get("/api/run_status/{run_id}")
async def run_status(run_id: str):
    """
    - Return status of given run_id from Supabase
    """
    pass

@app.get("/api/run_logs/{run_id}")
async def run_logs(run_id: str):
    """
    - Return logs from Supabase (for history/rehydration)
    """
    pass

@app.websocket("/ws/{run_id}")
async def websocket_endpoint(websocket: WebSocket, run_id: str):
    """
    - Connect client to WebSocket stream for this run
    - Stream log lines as they arrive from MAS subprocess
    """
    await ws_manager.connect(websocket, run_id)
    try:
        while True:
            log = await ws_manager.get_log(run_id)
            await websocket.send_json(log)
    except Exception:
        await ws_manager.disconnect(websocket, run_id)
