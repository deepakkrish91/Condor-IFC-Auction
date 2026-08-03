from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from broadcaster import broadcaster

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/auction")
async def auction_ws(websocket: WebSocket):
    await broadcaster.connect(websocket)
    try:
        while True:
            await websocket.receive_text()  # keep connection alive, ignore client messages
    except WebSocketDisconnect:
        await broadcaster.disconnect(websocket)
