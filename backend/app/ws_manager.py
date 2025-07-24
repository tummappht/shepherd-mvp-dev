# Manages all /ws/{run_id} connections

class WSManager:
    """
    Manages websocket clients and log streaming per run_id
    """
    def __init__(self):
        self.active_connections = {}  # run_id -> websocket(s)

    async def connect(self, websocket, run_id: str):
        """
        Register a websocket for a specific run_id
        """
        pass

    async def disconnect(self, websocket, run_id: str):
        """
        Remove a websocket from active connections
        """
        pass

    async def send_log(self, run_id: str, log: dict):
        """
        Send log line to all connected clients for this run
        """
        pass

    async def get_log(self, run_id: str):
        """
        Await next log line for this run (blocking or queue-based)
        """
        pass
