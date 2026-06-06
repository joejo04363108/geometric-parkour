import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pymongo import MongoClient
import datetime

app = FastAPI()

# === 1. 初始化 MongoDB 連線 ===
# 如果是本機資料庫用 'mongodb://localhost:27017/'
try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = client['geometric_parkour']       # 資料庫名稱
    rank_collection = db['leaderboard']    # 集合名稱（資料表）
    # 測試連線
    client.server_info()
    print("MongoDB 連線成功！")
except Exception as e:
    print(f"MongoDB 連線失敗，請檢查服務是否開啟。錯誤: {e}")

# 儲存連線中的玩家
active_connections = {}

@app.websocket("/ws/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await websocket.accept()
    
    active_connections[player_id] = {
        "ws": websocket,
        "x": 100,
        "y": 300
    }
    print(f"玩家連線成功: {player_id}，目前在線人數: {len(active_connections)}")

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 處理位置更新
            if message.get("type") == "update":
                active_connections[player_id]["x"] = message["x"]
                active_connections[player_id]["y"] = message["y"]
                
                payload = {
                    "type": "sync",
                    "id": player_id,
                    "x": message["x"],
                    "y": message["y"]
                }
                for conn_id, conn_data in active_connections.items():
                    if conn_id != player_id:
                        await conn_data["ws"].send_text(json.dumps(payload))
            
            # === 2. 處理玩家通關，寫入 MongoDB ===
            elif message.get("type") == "game_over":
                clear_time = message.get("time") # 拿到前端傳來的通關秒數
                
                # 準備寫入 MongoDB 的 Document 格式
                score_data = {
                    "player_id": player_id,
                    "clear_time": clear_time,
                    "date": datetime.datetime.now()
                }
                
                # 寫入資料庫
                rank_collection.insert_one(score_data)
                print(f"【資料庫紀錄】玩家 {player_id} 通關！時間: {clear_time} 秒")
                
                # 從資料庫撈出前 3 名的最速紀錄 (按時間升序排序)
                top_scores = list(rank_collection.find({}, {"_id": 0}).sort("clear_time", 1).limit(3))
                
                # 廣播排行榜給所有人
                rank_payload = {
                    "type": "leaderboard_update",
                    "leaderboard": top_scores
                }
                for conn_data in active_connections.values():
                    await conn_data["ws"].send_text(json.dumps(rank_payload))

    except WebSocketDisconnect:
        del active_connections[player_id]
        print(f"玩家斷線: {player_id}，目前在線人數: {len(active_connections)}")
        disconnect_payload = {"type": "disconnect", "id": player_id}
        for conn_data in active_connections.values():
            await conn_data["ws"].send_text(json.dumps(disconnect_payload))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)