import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from pymongo import MongoClient
import time
from fastapi.middleware.cors import CORSMiddleware  # <-- 1. 引入 CORS 套件

app = FastAPI()

# === 2. 允許跨域請求 (CORS) 設定 ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],             # 允許任何來源（包含你的 localhost:5500 或 內網 IP）
    allow_credentials=True,
    allow_methods=["*"],             # 允許所有方法（包含 POST, GET, OPTIONS 等）
    allow_headers=["*"],             # 允許所有標頭
)

# 1. MongoDB 初始化
try:
    client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=2000)
    db = client['geometric_parkour']
    users_collection = db['users']
    client.server_info()
    print("MongoDB 連線成功！")
except Exception as e:
    print(f"MongoDB 連線失敗: {e}")

# 2. 記憶體房間管理
# 結構: { room_id: { "host": str, "level": int, "players": { player_id: WebSocket } } }
rooms = {}

class AuthModel(BaseModel):
    username: str
    password: str

# HTTP 註冊與登入 API
@app.post("/api/register")
def register(data: AuthModel):
    if users_collection.find_one({"username": data.username}):
        return {"success": False, "msg": "帳號已存在"}
    users_collection.insert_one({"username": data.username, "password": data.password})
    return {"success": True, "msg": "註冊成功"}

@app.post("/api/login")
def login(data: AuthModel):
    user = users_collection.find_one({"username": data.username, "password": data.password})
    if user:
        return {"success": True, "msg": "登入成功"}
    return {"success": False, "msg": "帳號或密碼錯誤"}


@app.websocket("/ws/{room_id}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, player_id: str):
    await websocket.accept()
    
    # 初始化房間
    if room_id not in rooms:
        rooms[room_id] = {"host": player_id, "level": 1, "players": {}, "start_time": 0}
    
    rooms[room_id]["players"][player_id] = websocket
    
    # 廣播房間內最新的玩家名單
    await broadcast_room_members(room_id)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # 轉發即時遊戲狀態 (座標、血量、機關狀態)
            if message.get("type") in ["update", "interact"]:
                message["id"] = player_id
                for p_id, p_ws in rooms[room_id]["players"].items():
                    if p_id != player_id:
                        await p_ws.send_text(json.dumps(message))
            
            # 房主切換關卡
            elif message.get("type") == "change_level":
                if rooms[room_id]["host"] == player_id:
                    rooms[room_id]["level"] = message["level"]
                    await broadcast_to_room(room_id, {"type": "level_changed", "level": message["level"]})

            # 房主開始遊戲
            elif message.get("type") == "start_game":
                if rooms[room_id]["host"] == player_id:
                    rooms[room_id]["start_time"] = time.time()
                    await broadcast_to_room(room_id, {"type": "game_start"})
            
            # 遊戲結束結算 (成功或失敗)
            elif message.get("type") == "game_over":
                status = message.get("status") # "success" 或 "fail"
                elapsed = 0
                if status == "success" and rooms[room_id]["start_time"] > 0:
                    elapsed = round(time.time() - rooms[room_id]["start_time"], 2)
                
                await broadcast_to_room(room_id, {
                    "type": "game_result",
                    "status": status,
                    "level": rooms[room_id]["level"],
                    "time": elapsed
                })

    except WebSocketDisconnect:
        if room_id in rooms and player_id in rooms[room_id]["players"]:
            del rooms[room_id]["players"][player_id]
            print(f"玩家 {player_id} 離開房間 {room_id}")
            
            if not rooms[room_id]["players"]: # 房間沒人了，清除房間
                del rooms[room_id]
            else:
                # 如果房主離開了，更換房主
                if rooms[room_id]["host"] == player_id:
                    rooms[room_id]["host"] = list(rooms[room_id]["players"].keys())[0]
                await broadcast_room_members(room_id)

async def broadcast_room_members(room_id):
    if room_id in rooms:
        members = list(rooms[room_id]["players"].keys())
        payload = {
            "type": "room_info",
            "host": rooms[room_id]["host"],
            "members": members,
            "level": rooms[room_id]["level"]
        }
        await broadcast_to_room(room_id, payload)

async def broadcast_to_room(room_id, payload):
    if room_id in rooms:
        for p_ws in rooms[room_id]["players"].values():
            try:
                await p_ws.send_text(json.dumps(payload))
            except:
                pass

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)