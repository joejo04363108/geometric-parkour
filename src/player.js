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
            hasDash: false, dashTimer: 0, dashDir: 0,
            // 🔥 第三關能力擴充：攀爬爪狀態
            hasClaw: false, isWallClinging: false
        };
        this.remotePlayers = {};
    }

    resetStatus() {
        this.localPlayer.hp = 3;
        this.localPlayer.maxJumps = 1;
        this.localPlayer.hasDash = false;
        this.localPlayer.dashTimer = 0;
        this.localPlayer.jumpCount = 0;
        this.localPlayer.isGrounded = false;
        this.localPlayer.hasClaw = false;
        this.localPlayer.isWallClinging = false;
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
        
        // 跳躍判定 (包含一般跳躍與攀牆跳跳躍)
        if (code === 'Space' || code === 'ArrowUp' || code === 'KeyW') {
            if (p.isGrounded || p.jumpCount < p.maxJumps || p.isWallClinging) {
                p.vy = -p.jumpForce;
                p.jumpCount++;
                p.isGrounded = false;
                if (p.isWallClinging) {
                    // 攀牆跳時給予反方向的微小推力，做出跳離牆面的躍動感
                    p.vx = keys['ArrowLeft'] || keys['KeyA'] ? p.speed : -p.speed;
                    p.isWallClinging = false;
                }
            }
        }

        if (code === 'KeyE' && p.hasDash && p.dashTimer <= 0) {
            if (keys['ArrowLeft'] || keys['KeyA']) { p.dashTimer = 10; p.dashDir = -1; } 
            else if (keys['ArrowRight'] || keys['KeyD']) { p.dashTimer = 10; p.dashDir = 1; }
        }
    }

    update(keys, activePlatforms, canvasHeight, onHurt, onMove) {
        let p = this.localPlayer;
        let moved = false;

        if (p.dashTimer > 0) {
            p.vx = p.speed * 3 * p.dashDir; p.vy = 0; p.dashTimer--; moved = true;
        } else {
            if (keys['ArrowLeft'] || keys['KeyA']) { p.vx = -p.speed; moved = true; }
            else if (keys['ArrowRight'] || keys['KeyD']) { p.vx = p.speed; moved = true; }
            else p.vx = 0;

            // 🔥 攀牆爪物理：如果抓牆中，重力減半
            if (p.isWallClinging) {
                p.vy += this.GRAVITY * 0.2; // 緩慢滑落
                if (p.vy > 1.5) p.vy = 1.5; // 限制最高滑落速度
            } else {
                p.vy += this.GRAVITY;
            }
            if (p.vy !== 0) moved = true;
        }

        // X 軸碰撞偵測
        p.x += p.vx;
        let hittingWall = false;
        activePlatforms.forEach(plat => {
            if (this.checkCollision(p, plat)) {
                if (p.vx > 0) { p.x = plat.x - p.width; hittingWall = true; }
                if (p.vx < 0) { p.x = plat.x + plat.width; hittingWall = true; }
            }
        });

        // 🔥 判定是否進入攀牆爪抓牆狀態
        if (p.hasClaw && hittingWall && !p.isGrounded && p.vy > 0) {
            p.isWallClinging = true;
            p.jumpCount = 0; // 🛠️ 核心修正：抓牆時不斷重置跳躍次數，允許無限攀爬跳！
        } else {
            p.isWallClinging = false;
        }

        // Y 軸碰撞偵測
        if (p.dashTimer <= 0) {
            p.y += p.vy;
            activePlatforms.forEach(plat => {
                if (this.checkCollision(p, plat)) {
                    if (p.vy > 0) { 
                        p.y = plat.y - p.height; p.vy = 0;
                        p.isGrounded = true; p.jumpCount = 0; p.isWallClinging = false;
                    }
                    if (p.vy < 0) { p.y = plat.y + plat.height; p.vy = 0; }
                }
            });
        }

        if (p.y > canvasHeight) { this.minusHp(onHurt); moved = true; }
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
        this.localPlayer.isWallClinging = false;
    }

    updateRemote(id, x, y) { this.remotePlayers[id] = { x, y }; }
    removeRemote(id) { delete this.remotePlayers[id]; }

    draw(ctx) {
        for (let id in this.remotePlayers) {
            let rp = this.remotePlayers[id];
            ctx.fillStyle = '#ff9900'; ctx.fillRect(rp.x, rp.y, this.localPlayer.width, this.localPlayer.height);
            ctx.fillStyle = 'white'; ctx.font = '12px sans-serif'; ctx.fillText(id, rp.x - 10, rp.y - 10);
        }
        ctx.fillStyle = this.localPlayer.color;
        ctx.fillRect(this.localPlayer.x, this.localPlayer.y, this.localPlayer.width, this.localPlayer.height);
    }

    drawHearts(ctx) {
        ctx.fillStyle = '#ff3366'; ctx.font = '20px sans-serif';
        let hearts = "";
        for(let i=0; i<this.localPlayer.hp; i++) hearts += "❤️";
        if(this.localPlayer.hp <= 0) hearts = "💀 死亡";
        ctx.fillText(hearts, 650, 40);
    }
}