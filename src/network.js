export class NetworkManager {
    constructor(myId, onSync, onDisconnect, onLeaderboard) {
        const serverIP = window.location.hostname || 'localhost';
        this.ws = new WebSocket(`ws://${serverIP}:8000/ws/${myId}`);

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'sync') onSync(data.id, data.x, data.y);
            if (data.type === 'disconnect') onDisconnect(data.id);
            if (data.type === 'leaderboard_update') onLeaderboard(data.leaderboard);
        };
    }

    sendUpdate(x, y) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'update', x, y }));
        }
    }

    sendGameOver(clearTime) {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'game_over', time: parseFloat(clearTime) }));
        }
    }
}