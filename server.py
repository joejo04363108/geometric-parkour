import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# 用來儲存目前所有連線中的玩家 WebSocket 物件與其狀態
# 格式: { "player_uuid": { "ws": WebSocket, "x": 100, "y": 300 } }
active_connections = {}

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await websocket.accept()
    
    # 1. 玩家連線成功，初始化他的資料並加入管理名單
    active_connections[player_id] = {
        "ws": websocket,
        "x": 100,
        "y": 300
    }
    print(f"玩家連線成功: {player_id}，目前在線人數: {len(active_connections)}")

    try:
        while True:
            # 2. 持續接收該玩家傳來的最新位置
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "update":
                # 更新伺服器端紀錄的玩家位置
                active_connections[player_id]["x"] = message["x"]
                active_connections[player_id]["y"] = message["y"]
                
                # 3. 廣播給「其他所有玩家」
                payload = {
                    "type": "sync",
                    "id": player_id,
                    "x": message["x"],
                    "y": message["y"]
                }
                
                # 遍歷所有連線，排除發送者本人
                for conn_id, conn_data in active_connections.items():
                    if conn_id != player_id:
                        await conn_data["ws"].send_text(json.dumps(payload))

    except WebSocketDisconnect:
        # 4. 玩家斷線處理
        del active_connections[player_id]
        print(f"玩家斷線: {player_id}，目前在線人數: {len(active_connections)}")
        
        # 廣播告訴其他人該玩家離開了
        disconnect_payload = {"type": "disconnect", "id": player_id}
        for conn_data in active_connections.values():
            await conn_data["ws"].send_text(json.dumps(disconnect_payload))

if __name__ == "__main__":
    import uvicorn
    # 這裡綁定 0.0.0.0 是讓區域網路內網的其他電腦可以透過你的 IP 連進來
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)