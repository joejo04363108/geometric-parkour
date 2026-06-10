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
        this.ws = new WebSocket(`ws://${this.serverIP}:8000/ws/${roomId}/${pId}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'room_info') this.onRoomInfo(data);
            if (data.type === 'update') this.onSync(data.id, data);
            if (data.type === 'interact') this.onSync(data.id, data);
            if (data.type === 'disconnect') this.onDisconnect(data.id);
            if (data.type === 'game_start') this.onGameStart();
            if (data.type === 'game_result') this.onGameResult(data);
            
            // 🔥 新增：當收到後端說房主切換關卡時，同步通知前端大腦
            if (data.type === 'level_changed') {
                if (this.onLevelChanged) this.onLevelChanged(data.level);
            }
        };
    }

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
}