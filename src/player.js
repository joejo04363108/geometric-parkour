export class PlayerManager {
    constructor(myId) {
        this.myId = myId;
        this.GRAVITY = 0.4;
        this.localPlayer = {
            x: 100, y: 300, width: 30, height: 30,
            vx: 0, vy: 0, 
            speed: 3.5, jumpForce: 11,
            isGrounded: false, color: '#00ffcc',
            hp: 3, jumpCount: 0, maxJumps: 1,
            // 🔥 第二關能力擴充
            maxJumps: 1, hasDash: false, dashTimer: 0, dashDir: 0
        };
        this.remotePlayers = {};
    }

    resetStatus() {
        // 🔥 確保每次開局或跨關，血量、二段跳、Dash 機制全部洗回初始狀態
        this.localPlayer.hp = 3;
        this.localPlayer.maxJumps = 1;
        this.localPlayer.hasDash = false;
        this.localPlayer.dashTimer = 0;
        this.localPlayer.jumpCount = 0;
        this.localPlayer.isGrounded = false;
        this.resetLocalPlayerPosition();
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    handleKeyDown(code, keys) {
        let p = this.localPlayer;
        
        // 跳躍判定
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
            if (p.isGrounded || p.jumpCount < p.maxJumps) {
                p.vy = -p.jumpForce;
                p.jumpCount++;
                p.isGrounded = false;
            }
        }

        // 🔥 新增：按下 E 鍵且擁有 Dash 能力，同時有按著 A 或 D
        if (code === 'KeyE' && p.hasDash && p.dashTimer <= 0) {
            if (keys['ArrowLeft'] || keys['KeyA']) {
                p.dashTimer = 10; // 衝刺持續 10 幀
                p.dashDir = -1;
            } else if (keys['ArrowRight'] || keys['KeyD']) {
                p.dashTimer = 10;
                p.dashDir = 1;
            }
        }
    }

    update(keys, activePlatforms, canvasHeight, onHurt, onMove) {
        let p = this.localPlayer;
        let moved = false;

        // 🔥 Dash 衝刺狀態機更新
        if (p.dashTimer > 0) {
            p.vx = p.speed * 3 * p.dashDir; // 3倍速衝刺
            p.vy = 0; // 衝刺時不受重力影響
            p.dashTimer--;
            moved = true;
        } else {
            // 一般移動邏 attraction
            if (keys['ArrowLeft'] || keys['KeyA']) { p.vx = -p.speed; moved = true; }
            else if (keys['ArrowRight'] || keys['KeyD']) { p.vx = p.speed; moved = true; }
            else p.vx = 0;

            p.vy += this.GRAVITY;
            if (p.vy !== 0) moved = true;
        }

        // X 軸位移與碰撞 (衝刺時也會撞牆)
        p.x += p.vx;
        activePlatforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vx > 0) p.x = plat.x - p.width;
                if (p.vx < 0) p.x = plat.x + plat.width;
            }
        });

        // Y 軸位移與碰撞
        if (p.dashTimer <= 0) { // 衝刺時不處理 Y 軸碰撞
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
        }

        if (p.y > canvasHeight) {
            this.minusHp(onHurt);
            moved = true;
        }

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
        this.localPlayer.dashTimer = 0;
    }

    updateRemote(id, x, y) {
        this.remotePlayers[id] = { x: x, y: y };
    }

    removeRemote(id) { delete this.remotePlayers[id]; }

    draw(ctx) {
        for (let id in this.remotePlayers) {
            let rp = this.remotePlayers[id];
            ctx.fillStyle = '#ff9900';
            ctx.fillRect(rp.x, rp.y, this.localPlayer.width, this.localPlayer.height);
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(id, rp.x - 10, rp.y - 10);
        }
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