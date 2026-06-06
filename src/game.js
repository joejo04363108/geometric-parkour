import { PlayerManager } from './player.js';
import { MapManager } from './map.js';
import { NetworkManager } from './network.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.camera = { x: 0 };
        this.leaderboardData = [];
        this.startTime = Date.now();

        // 初始化隨機 ID
        this.myId = 'player_' + Math.random().toString(36).substr(2, 9);

        // 初始化三大子模組
        this.playerMgr = new PlayerManager(this.myId);
        this.mapMgr = new MapManager();
        this.networkMgr = new NetworkManager(
            this.myId,
            (id, x, y) => this.playerMgr.updateRemote(id, x, y),
            (id) => this.playerMgr.removeRemote(id),
            (data) => this.leaderboardData = data
        );

        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);

        this.gameLoop();
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // 更新玩家物理與移動
        this.playerMgr.update(
            this.keys, 
            this.mapMgr.platforms, 
            this.canvas.height,
            () => this.startTime = Date.now(), // 墜落死亡時重置計時器
            (x, y) => this.networkMgr.sendUpdate(x, y) // 移動時發送 WebSocket
        );

        let p = this.playerMgr.localPlayer;

        // 判定是否抵達終點
        if (this.playerMgr.checkCollision(p, this.mapMgr.goal)) {
            let totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
            alert(`🎉 你通關了！總共花費了 ${totalTime} 秒！`);
            
            this.networkMgr.sendGameOver(totalTime);
            this.playerMgr.resetLocalPlayer();
            this.startTime = Date.now();
        }

        // 相機跟隨
        this.camera.x = p.x - this.canvas.width / 3;
        if (this.camera.x < 0) this.camera.x = 0;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 1. 繪製固定排行榜 UI
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 16px sans-serif";
        this.ctx.fillText("🏆 排行榜 (MongoDB)", 20, 100);
        
        if (this.leaderboardData.length === 0) {
            this.ctx.fillStyle = "#aaa";
            this.ctx.fillText("(等候挑戰中...)", 20, 125);
        } else {
            this.ctx.fillStyle = "#ffcc00";
            this.leaderboardData.forEach((record, index) => {
                this.ctx.fillText(`${index + 1}. ${record.player_id} : ${record.clear_time}秒`, 20, 125 + index * 22);
            });
        }

        // 2. 繪製滾動的世界場景
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        this.mapMgr.draw(this.ctx);
        this.playerMgr.draw(this.ctx);
        
        this.ctx.restore();
    }
}

// 啟動遊戲
new Game();