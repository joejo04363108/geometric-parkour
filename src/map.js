export class MapManager {
    constructor() {
        this.currentLevel = 1;
        this.platforms = [];
        this.activePlatforms = [];
        
        this.goal = { x: 0, y: 0, width: 30, height: 50, color: '#ff3366' };
        
        // 第一關機關宣告
        this.switch1 = { x: 0, y: 0, width: 0, height: 0, pressed: false };
        this.gate1 = { x: 0, y: 0, width: 0, height: 0, closed: true };
        this.itemDoubleJump = { x: 0, y: 0, width: 0, height: 0, collected: false, color: '#ffff00' };
        this.switch2 = { x: 0, y: 0, width: 0, height: 0, pressed: false };
        this.movingPlatform = { x: 0, y: 0, width: 0, height: 0, minY: 0, maxY: 0, dir: 1, speed: 0 };

        // 第二關機關宣告
        this.lvl2_btn1 = { x: 0, y: 0, width: 0, height: 0, pressed: false };
        // 🛠️ 修正：調整柱子的初始高度與頂部判定
        this.lvl2_pillar = { x: 0, y: 0, width: 0, height: 0, currentY: 0, targetY: 0 };
        this.itemDash = { x: 0, y: 0, width: 0, height: 0, collected: false, color: '#0077ff' };
        this.lvl2_movePlat = { x: 0, y: 0, width: 0, height: 0, minX: 0, maxX: 0, dir: 1, speed: 0 };
        this.vanishingPlatforms = [];
        this.lvl2_btn2 = { x: 0, y: 0, width: 0, height: 0, pressed: false };
        this.lvl2_rescuePlat = { x: 0, y: 0, width: 0, height: 0, currentY: 0, targetY: 0 };

        this.initLevel(1);
    }

    initLevel(level) {
        this.currentLevel = level;
        
        if (level === 1) {
            this.goal = { x: 1350, y: 300, width: 30, height: 50, color: '#ff3366' };
            this.platforms = [
                { x: 0, y: 400, width: 350, height: 50 },     
                { x: 450, y: 400, width: 250, height: 50 },    
                { x: 1050, y: 350, width: 350, height: 100 }   
            ];
            this.switch1 = { x: 250, y: 390, width: 40, height: 10, pressed: false };
            this.gate1 = { x: 400, y: 250, width: 15, height: 150, closed: true };
            this.itemDoubleJump = { x: 550, y: 300, width: 20, height: 20, collected: false, color: '#ffff00' };
            this.switch2 = { x: 1060, y: 340, width: 40, height: 10, pressed: false };
            this.movingPlatform = { x: 800, y: 200, width: 150, height: 20, minY: 200, maxY: 350, dir: 1, speed: 1.5 };
            this.movingPlatform.y = 200;

        } else if (level === 2) {
            this.goal = { x: 2500, y: 200, width: 30, height: 50, color: '#ff3366' };
            this.platforms = [
                { x: 0, y: 400, width: 400, height: 50 },       
                { x: 500, y: 300, width: 150, height: 20 },     
                { x: 1500, y: 250, width: 100, height: 20 },    
                { x: 1900, y: 250, width: 650, height: 200 }    
            ];

            this.lvl2_btn1 = { x: 200, y: 390, width: 40, height: 10, pressed: false };
            
            // 🛠️ 修正：讓柱子初始高度完美貼平地面 (y:400)，寬度放大到 50，上升速度改為 2 幀，更平穩把人推上去
            this.lvl2_pillar = { x: 120, y: 400, width: 50, height: 300, currentY: 400, targetY: 250 };
            
            this.itemDash = { x: 135, y: 200, width: 20, height: 20, collected: false, color: '#0077ff' };
            this.lvl2_movePlat = { x: 800, y: 250, width: 120, height: 20, minX: 750, maxX: 1050, dir: 1, speed: 2 };
            
            this.vanishingPlatforms = [
                { x: 1150, y: 250, width: 100, height: 20, touchTimer: -1, visible: true },
                { x: 1350, y: 200, width: 100, height: 20, touchTimer: -1, visible: true }
            ];

            this.lvl2_btn2 = { x: 1950, y: 240, width: 40, height: 10, pressed: false };
            this.lvl2_rescuePlat = { x: 1600, y: 450, width: 250, height: 20, currentY: 450, targetY: 250 };
        }
    }

    updateMechanics(sw1Pressed, sw2Pressed, localPlayer, remotePlayers, onInteract) {
        if (this.currentLevel === 1) {
            this.switch1.pressed = sw1Pressed;
            this.gate1.closed = !sw1Pressed;
            this.switch2.pressed = sw2Pressed;

            if (this.switch2.pressed) {
                this.movingPlatform.y += this.movingPlatform.speed * this.movingPlatform.dir;
                if (this.movingPlatform.y >= this.movingPlatform.maxY || this.movingPlatform.y <= this.movingPlatform.minY) this.movingPlatform.dir *= -1;
            }

            this.activePlatforms = [...this.platforms, this.movingPlatform];
            if (this.gate1.closed) this.activePlatforms.push(this.gate1);

            if (!this.itemDoubleJump.collected && this.checkOverlap(localPlayer, this.itemDoubleJump)) {
                this.itemDoubleJump.collected = true;
                localPlayer.maxJumps = 2; 
                onInteract({ type: 'item_collected' });
            }
        } 
        else if (this.currentLevel === 2) {
            this.lvl2_btn1.pressed = sw1Pressed;
            this.lvl2_btn2.pressed = sw2Pressed;

            // 🛠️ 修正：平滑上升邏輯。當柱子上升時，如果玩家站在上面，強行將玩家的 Y 軸貼在柱子頂端，防止掉落
            let oldPillarY = this.lvl2_pillar.currentY;
            if (this.lvl2_btn1.pressed) {
                if (this.lvl2_pillar.currentY > this.lvl2_pillar.targetY) this.lvl2_pillar.currentY -= 2;
            } else {
                if (this.lvl2_pillar.currentY < 400) this.lvl2_pillar.currentY += 2;
            }
            this.lvl2_pillar.y = this.lvl2_pillar.currentY;

            // 如果本地玩家踩在柱子上，隨著柱子同步上升
            if (this.checkOverlap(localPlayer, this.lvl2_pillar) && localPlayer.vy >= 0) {
                localPlayer.y = this.lvl2_pillar.y - localPlayer.height;
                localPlayer.vy = 0;
                localPlayer.isGrounded = true;
            }

            this.lvl2_movePlat.x += this.lvl2_movePlat.speed * this.lvl2_movePlat.dir;
            if (this.lvl2_movePlat.x >= this.lvl2_movePlat.maxX || this.lvl2_movePlat.x <= this.lvl2_movePlat.minX) this.lvl2_movePlat.dir *= -1;

            // 🛠️ 修正：消失平台觸碰偵測。引入 3 像素的緩衝空間（Tolerance），確保踩上去時一定能觸發計時器
            this.vanishingPlatforms.forEach(p => {
                if (p.visible) {
                    // 虛擬一個稍微往上加高 3 像素的探測矩形
                    let detectionRect = { x: p.x, y: p.y - 3, width: p.width, height: p.height + 3 };
                    let localTouch = this.checkOverlap(localPlayer, detectionRect);
                    
                    // 遠端隊友踩到也要能觸發
                    let remoteTouch = false;
                    for (let id in remotePlayers) {
                        if (this.checkOverlap(remotePlayers[id], detectionRect)) remoteTouch = true;
                    }

                    if ((localTouch || remoteTouch) && p.touchTimer === -1) {
                        p.touchTimer = 45; // 調整為約 0.75 秒後消失，增加驚險感！
                    }
                    if (p.touchTimer > 0) {
                        p.touchTimer--;
                        if (p.touchTimer === 0) p.visible = false;
                    }
                }
            });

            if (this.lvl2_btn2.pressed) {
                if (this.lvl2_rescuePlat.currentY > this.lvl2_rescuePlat.targetY) this.lvl2_rescuePlat.currentY -= 2;
            }
            this.lvl2_rescuePlat.y = this.lvl2_rescuePlat.currentY;

            this.activePlatforms = [...this.platforms, this.lvl2_pillar, this.lvl2_movePlat, this.lvl2_rescuePlat];
            this.vanishingPlatforms.forEach(p => {
                if (p.visible) this.activePlatforms.push(p);
            });

            if (!this.itemDash.collected && this.checkOverlap(localPlayer, this.itemDash)) {
                this.itemDash.collected = true;
                localPlayer.hasDash = true;
                onInteract({ type: 'item_dash_collected' });
            }
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

        if (this.currentLevel === 1) {
            ctx.fillStyle = this.switch1.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.switch1.x, this.switch1.y, this.switch1.width, this.switch1.height);
            ctx.fillStyle = this.switch2.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.switch2.x, this.switch2.y, this.switch2.width, this.switch2.height);
            if (this.gate1.closed) { ctx.fillStyle = '#888'; ctx.fillRect(this.gate1.x, this.gate1.y, this.gate1.width, this.gate1.height); }
            ctx.fillStyle = '#666'; ctx.fillRect(this.movingPlatform.x, this.movingPlatform.y, this.movingPlatform.width, this.movingPlatform.height);
            
            if (!this.itemDoubleJump.collected) { 
                ctx.fillStyle = this.itemDoubleJump.color; 
                ctx.fillRect(this.itemDoubleJump.x, this.itemDoubleJump.y, this.itemDoubleJump.width, this.itemDoubleJump.height); 
                // 🛠️ 幫你補回的第一關優雅文字顯示
                ctx.fillStyle = 'white'; ctx.font = '10px sans-serif';
                ctx.fillText("Double Jump", this.itemDoubleJump.x - 15, this.itemDoubleJump.y - 5);
            }
        } 
        else if (this.currentLevel === 2) {
            ctx.fillStyle = '#555';
            ctx.fillRect(this.lvl2_pillar.x, this.lvl2_pillar.currentY, this.lvl2_pillar.width, this.lvl2_pillar.height);
            
            ctx.fillStyle = this.lvl2_btn1.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.lvl2_btn1.x, this.lvl2_btn1.y, this.lvl2_btn1.width, this.lvl2_btn1.height);

            ctx.fillStyle = '#666';
            ctx.fillRect(this.lvl2_movePlat.x, this.lvl2_movePlat.y, this.lvl2_movePlat.width, this.lvl2_movePlat.height);

            this.vanishingPlatforms.forEach(p => {
                if (p.visible) {
                    ctx.fillStyle = p.touchTimer > 0 ? '#ffaa44' : '#775577';
                    ctx.fillRect(p.x, p.y, p.width, p.height);
                }
            });

            ctx.fillStyle = this.lvl2_btn2.pressed ? '#00ff00' : '#ff3333';
            ctx.fillRect(this.lvl2_btn2.x, this.lvl2_btn2.y, this.lvl2_btn2.width, this.lvl2_btn2.height);

            ctx.fillStyle = '#3a6f54';
            ctx.fillRect(this.lvl2_rescuePlat.x, this.lvl2_rescuePlat.currentY, this.lvl2_rescuePlat.width, this.lvl2_rescuePlat.height);

            if (!this.itemDash.collected) {
                ctx.fillStyle = this.itemDash.color;
                ctx.fillRect(this.itemDash.x, this.itemDash.y, this.itemDash.width, this.itemDash.height);
                ctx.fillStyle = 'white'; ctx.font = '10px sans-serif';
                ctx.fillText("DASH (按E)", this.itemDash.x - 15, this.itemDash.y - 5);
            }
        }

        ctx.fillStyle = this.goal.color;
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    }
}