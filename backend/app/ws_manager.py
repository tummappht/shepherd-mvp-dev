# ws_manager.py
from collections import defaultdict, deque
from typing import Dict, Set
from fastapi import WebSocket
class WebSocketManager:
    """
    • Keeps {run_id → set(WebSocket)}  
    • Stores the last N messages so late joiners can catch up
    """
    MAX_BUFFER = 2000         # keep last 2 000 log msgs ≈ a few MB total

    def __init__(self) -> None:
        self._conns:   Dict[str, Set[WebSocket]] = defaultdict(set)
        self._buffers: Dict[str, deque]          = defaultdict(lambda: deque(maxlen=self.MAX_BUFFER))

    async def connect(self, run_id: str, ws: WebSocket) -> None:
        await ws.accept()
        self._conns[run_id].add(ws)

        # ① application-level confirmation
        await ws.send_json({"type": "connection_ack", "run_id": run_id})

        # ② dump any backlog (if the run already started)
        for msg in self._buffers[run_id]:
            await ws.send_json(msg)

    def disconnect(self, run_id: str, ws: WebSocket) -> None:
        self._conns[run_id].discard(ws)

    async def send_log(self, run_id: str, payload: dict) -> None:
        # cache first
        self._buffers[run_id].append(payload)

        # then fan-out
        stale = set()
        for ws in self._conns[run_id]:
            try:
                await ws.send_json(payload)
            except RuntimeError:
                stale.add(ws)
        for ws in stale:
            self.disconnect(run_id, ws)