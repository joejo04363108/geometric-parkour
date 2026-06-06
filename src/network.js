export class NetworkManager {
    constructor(onRoomInfo, onSync, onDisconnect, onGameStart, onGameResult) {
        this.serverIP = window.location.hostname || 'localhost';
        this.httpUrl = `http://${this.serverIP}:8000/api`;
        this.ws = null;
        
        // 回呼控制快取
        this.onRoomInfo = onRoomInfo;
        this.onSync = onSync;
        this.onDisconnect = onDisconnect;
        this.onGameStart = onGameStart;
        this.onGameResult = onGameResult;
    }

    // 帳號登入 API 串接
    async login(username, password) {
        const res = await fetch(`${this.httpUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await res.json();
    }

    // 帳號註冊 API 串接
    async register(username, password) {
        const res = await fetch(`${this.httpUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return await res.json();
    }

    // 進入房間時，才正式啟動 WebSocket
    connectRoom(roomId, pId) {
        // 確保路徑格式為 /ws/房間名/用戶名
        this.ws = new WebSocket(`ws://${this.serverIP}:8000/ws/${roomId}/${pId}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 🛠️ 核心修正：統一處理後端轉發過來的事件類型
            if (data.type === 'room_info') this.onRoomInfo(data);
            if (data.type === 'update') this.onSync(data.id, data);
            if (data.type === 'interact') this.onSync(data.id, data);
            if (data.type === 'disconnect') this.onDisconnect(data.id);
            if (data.type === 'game_start') this.onGameStart();
            if (data.type === 'game_result') this.onGameResult(data);
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}