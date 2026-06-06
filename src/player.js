export class PlayerManager {
    constructor(myId) {
        this.myId = myId;
        this.GRAVITY = 0.4; // 稍微調小重力，讓跳躍軌跡更平滑
        this.localPlayer = {
            x: 100, y: 300, width: 30, height: 30,
            vx: 0, vy: 0, 
            speed: 3.5,       //移動速度
            jumpForce: 11,    //跳躍高度
            isGrounded: false, color: '#00ffcc',
            hp: 3, jumpCount: 0, maxJumps: 1
        };
        this.remotePlayers = {};
    }

    // 每次重新開局時呼叫，完整重置血量與能力
    resetStatus() {
        this.localPlayer.hp = 3;
        this.localPlayer.maxJumps = 1;
        this.resetLocalPlayerPosition();
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    handleKeyDown(code) {
        let p = this.localPlayer;
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
            if (p.isGrounded || p.jumpCount < p.maxJumps) {
                p.vy = -p.jumpForce;
                p.jumpCount++;
                p.isGrounded = false;
            }
        }
    }

    update(keys, activePlatforms, canvasHeight, onHurt, onMove) {
        let p = this.localPlayer;
        let moved = false;

        let lastX = p.x;
        let lastY = p.y;

        if (keys['ArrowLeft'] || keys['KeyA']) { p.vx = -p.speed; moved = true; }
        else if (keys['ArrowRight'] || keys['KeyD']) { p.vx = p.speed; moved = true; }
        else p.vx = 0;

        p.vy += this.GRAVITY;
        if (p.vy !== 0) moved = true;

        // X 軸位移與碰撞
        p.x += p.vx;
        activePlatforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vx > 0) p.x = plat.x - p.width;
                if (p.vx < 0) p.x = plat.x + plat.width;
            }
        });

        // Y 軸位移與碰撞
        p.y += p.vy;
        activePlatforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vy > 0) { 
                    p.y = plat.y - p.height; p.vy = 0;
                    p.isGrounded = true; p.jumpCount = 0; 
                }
                if (p.vy < 0) { p.y = plat.y + plat.height; p.vy = 0; }
            }
        });

        // 墜落判定
        if (p.y > canvasHeight) {
            this.minusHp(onHurt);
            moved = true;
        }

        // 強制每幀發送位置，確保即時流暢同步
        onMove(p.x, p.y, p.hp);
    }

    minusHp(onHurt) {
        let p = this.localPlayer;
        p.hp--;
        this.resetLocalPlayerPosition();
        onHurt(p.hp);
    }

    resetLocalPlayerPosition() {
        this.localPlayer.x = 100;
        this.localPlayer.y = 300;
        this.localPlayer.vx = 0;
        this.localPlayer.vy = 0;
    }

    // 🛠️ 關鍵修正：確保正確接收解包後的 x 和 y
    updateRemote(id, x, y) {
        this.remotePlayers[id] = { x: x, y: y };
    }

    removeRemote(id) {
        delete this.remotePlayers[id];
    }

    draw(ctx) {
        // 畫其他玩家
        for (let id in this.remotePlayers) {
            let rp = this.remotePlayers[id];
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(rp.x, rp.y, this.localPlayer.width, this.localPlayer.height);
            
            // 畫名字標籤
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(id, rp.x - 10, rp.y - 10);
        }
        
        // 畫自己
        ctx.fillStyle = this.localPlayer.color;
        ctx.fillRect(this.localPlayer.x, this.localPlayer.y, this.localPlayer.width, this.localPlayer.height);
    }

    drawHearts(ctx) {
        ctx.fillStyle = '#ff3366';
        ctx.font = '20px sans-serif';
        let hearts = "";
        for(let i=0; i<this.localPlayer.hp; i++) hearts += "❤️";
        if(this.localPlayer.hp <= 0) hearts = "💀 死亡";
        ctx.fillText(hearts, 650, 40);
    }
}