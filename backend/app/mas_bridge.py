# Launches MAS subprocess and streams logs to the frontend

import asyncio

async def launch_mas(run_id: str, job: dict, ws_manager):
    """
    - Launch MAS subprocess (as async process)
    - Pipe stdout/stderr to ws_manager for this run_id
    - Optionally parse stdout lines and push as MASLogLine
    - Save output to Supabase for history
    """
    pass  # TODO: implement MAS subprocess orchestration
