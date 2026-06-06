export class MapManager {
    constructor() {
        this.currentLevel = 1;
        this.platforms = [];
        this.goal = { x: 1350, y: 200, width: 30, height: 50, color: '#ff3366' };
        
        // 機關一與門 (沿用)
        this.switch1 = { x: 250, y: 390, width: 40, height: 10, pressed: false };
        this.gate1 = { x: 400, y: 250, width: 15, height: 150, closed: true };
        
        // 🔥 沿用你修改後的道具新數值
        this.itemDoubleJump = { x: 550, y: 300, width: 20, height: 20, collected: false, color: '#ffff00' };

        // 🔥 新增：開關二與動態移動平台設定
        this.switch2 = { x: 1060, y: 340, width: 40, height: 10, pressed: false };
        this.movingPlatform = { 
            x: 800, y: 300, width: 150, height: 20, 
            minY: 200, maxY: 350, dir: 1, speed: 1.5 
        };

        this.initLevel(1);
    }

    initLevel(level) {
        this.currentLevel = level;
        if (level === 1) {
            this.platforms = [
                { x: 0, y: 400, width: 350, height: 50 },     
                { x: 450, y: 400, width: 250, height: 50 },    
                // 移除原本寫死的高牆平台，改用動態平台
                { x: 1050, y: 350, width: 350, height: 100 }   
            ];
            this.switch1.pressed = false;
            this.gate1.closed = true;
            this.itemDoubleJump.collected = false;
            this.switch2.pressed = false;
            this.movingPlatform.y = 200;
        }
    }

    // 🛠️ 升級：接收兩個開關的全域狀態
    updateMechanics(sw1Pressed, sw2Pressed, localPlayer, onInteract) {
        if (this.currentLevel !== 1) return;

        // 更新開關一與大門
        this.switch1.pressed = sw1Pressed;
        this.gate1.closed = !sw1Pressed;

        // 更新開關二狀態
        this.switch2.pressed = sw2Pressed;

        // 🔥 如果開關二被踩住，動態平台開始上下移動
        if (this.switch2.pressed) {
            this.movingPlatform.y += this.movingPlatform.speed * this.movingPlatform.dir;
            if (this.movingPlatform.y >= this.movingPlatform.maxY || this.movingPlatform.y <= this.movingPlatform.minY) {
                this.movingPlatform.dir *= -1; // 觸底或觸頂反彈
            }
        }

        // 組裝實體碰撞平台名單
        this.activePlatforms = [...this.platforms, this.movingPlatform];
        if (this.gate1.closed) {
            this.activePlatforms.push(this.gate1);
        }

        // 撿拾道具判定
        if (!this.itemDoubleJump.collected && this.checkOverlap(localPlayer, this.itemDoubleJump)) {
            this.itemDoubleJump.collected = true;
            localPlayer.maxJumps = 2; 
            onInteract({ type: 'item_collected' });
        }
    }

    checkOverlap(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw(ctx) {
        ctx.fillStyle = '#444';
        this.platforms.forEach(plat => ctx.fillRect(plat.x, plat.y, plat.width, plat.height));
        
        // 畫動態移動平台
        ctx.fillRect(this.movingPlatform.x, this.movingPlatform.y, this.movingPlatform.width, this.movingPlatform.height);

        if (this.currentLevel === 1) {
            // 畫按鈕一
            ctx.fillStyle = this.switch1.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.switch1.x, this.switch1.y, this.switch1.width, this.switch1.height);

            // 畫按鈕二
            ctx.fillStyle = this.switch2.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.switch2.x, this.switch2.y, this.switch2.width, this.switch2.height);

            if (this.gate1.closed) {
                ctx.fillStyle = '#888';
                ctx.fillRect(this.gate1.x, this.gate1.y, this.gate1.width, this.gate1.height);
            }

            if (!this.itemDoubleJump.collected) {
                ctx.fillStyle = this.itemDoubleJump.color;
                ctx.fillRect(this.itemDoubleJump.x, this.itemDoubleJump.y, this.itemDoubleJump.width, this.itemDoubleJump.height);
                ctx.fillStyle = 'white';
                ctx.font = '10px sans-serif';
                ctx.fillText("二段跳", this.itemDoubleJump.x - 5, this.itemDoubleJump.y - 5);
            }
        }

        ctx.fillStyle = this.goal.color;
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    }
}