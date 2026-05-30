from __future__ import annotations

import asyncio
import json
from collections import defaultdict

from fastapi import WebSocket


class TrackingRealtimeHub:
    def __init__(self) -> None:
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    @staticmethod
    def topic_key(tenant_id: str, shipment_id: str) -> str:
        return f"tracking:{tenant_id}:{shipment_id}"

    async def connect(self, tenant_id: str, shipment_id: str, websocket: WebSocket) -> str:
        topic = self.topic_key(tenant_id, shipment_id)
        await websocket.accept()
        async with self._lock:
            self._connections[topic].add(websocket)
        return topic

    async def disconnect(self, topic: str, websocket: WebSocket) -> None:
        async with self._lock:
            self._connections[topic].discard(websocket)
            if not self._connections[topic]:
                self._connections.pop(topic, None)

    async def publish(self, tenant_id: str, shipment_id: str, payload: dict) -> None:
        topic = self.topic_key(tenant_id, shipment_id)
        async with self._lock:
            targets = list(self._connections.get(topic, set()))
        if not targets:
            return

        message = json.dumps(payload, default=str)
        stale: list[WebSocket] = []
        for ws in targets:
            try:
                await ws.send_text(message)
            except Exception:
                stale.append(ws)

        if stale:
            async with self._lock:
                for ws in stale:
                    self._connections[topic].discard(ws)


tracking_realtime_hub = TrackingRealtimeHub()
