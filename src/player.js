export class PlayerManager {
    constructor(myId) {
        this.myId = myId;
        this.GRAVITY = 0.5;
        this.localPlayer = {
            x: 100, y: 300, width: 30, height: 30,
            vx: 0, vy: 0, speed: 5, jumpForce: 12,
            isGrounded: false, color: '#00ffcc'
        };
        this.remotePlayers = {};
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    update(keys, platforms, canvasHeight, onReset, onMove) {
        let moved = false;
        let p = this.localPlayer;

        // 左右移動
        if (keys['ArrowLeft'] || keys['KeyA']) { p.vx = -p.speed; moved = true; }
        else if (keys['ArrowRight'] || keys['KeyD']) { p.vx = p.speed; moved = true; }
        else p.vx = 0;

        // 跳躍
        if ((keys['Space'] || keys['ArrowUp'] || keys['KeyW']) && p.isGrounded) {
            p.vy = -p.jumpForce;
            p.isGrounded = false;
            moved = true;
        }

        p.vy += this.GRAVITY;
        if (p.vy !== 0) moved = true;

        // X 軸位移與碰撞
        p.x += p.vx;
        platforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vx > 0) p.x = plat.x - p.width;
                if (p.vx < 0) p.x = plat.x + plat.width;
            }
        });

        // Y 軸位移與碰撞
        p.y += p.vy;
        p.isGrounded = false;
        platforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vy > 0) { p.y = plat.y - p.height; p.vy = 0; p.isGrounded = true; }
                if (p.vy < 0) { p.y = plat.y + plat.height; p.vy = 0; }
            }
        });

        // 墜落判定
        if (p.y > canvasHeight) {
            this.resetLocalPlayer();
            onReset();
        }

        // 如果移動了，觸發回呼函式通知連線模組
        if (moved) {
            onMove(p.x, p.y);
        }
    }

    resetLocalPlayer() {
        this.localPlayer.x = 100;
        this.localPlayer.y = 300;
        this.localPlayer.vx = 0;
        this.localPlayer.vy = 0;
    }

    updateRemote(id, x, y) {
        this.remotePlayers[id] = { x, y };
    }

    removeRemote(id) {
        delete this.remotePlayers[id];
    }

    draw(ctx) {
        // 畫其他玩家
        ctx.fillStyle = '#ff9900';
        for (let id in this.remotePlayers) {
            let p = this.remotePlayers[id];
            ctx.fillRect(p.x, p.y, this.localPlayer.width, this.localPlayer.height);
        }
        // 畫本地玩家
        ctx.fillStyle = this.localPlayer.color;
        ctx.fillRect(this.localPlayer.x, this.localPlayer.y, this.localPlayer.width, this.localPlayer.height);
    }
}