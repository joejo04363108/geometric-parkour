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
        this.lvl2_pillar = { x: 0, y: 0, width: 0, height: 0, currentY: 0, targetY: 0 };
        this.itemDash = { x: 0, y: 0, width: 0, height: 0, collected: false, color: '#0077ff' };
        this.lvl2_movePlat = { x: 0, y: 0, width: 0, height: 0, minX: 0, maxX: 0, dir: 1, speed: 0 };
        this.vanishingPlatforms = [];
        this.lvl2_btn2 = { x: 0, y: 0, width: 0, height: 0, pressed: false };
        this.lvl2_rescuePlat = { x: 0, y: 0, width: 0, height: 0, currentY: 0, targetY: 0 };

        // --- 🎯 第三關地牢專屬機關與障礙宣告 ---
        this.itemClaw = { x: 0, y: 0, width: 0, height: 0, collected: false, color: '#ff00ff' }; 
        this.lvl3_btn = { x: 0, y: 0, width: 0, height: 0, pressed: false }; 
        this.lvl3_hiddenBridge = { x: 0, y: 0, width: 0, height: 0, currentY: 0, targetY: 0 }; 
        this.spikes = [];
        this.monster = { x: 0, y: 0, width: 0, height: 0, minX: 0, maxX: 0, dir: 1, speed: 0 };
        this.crusher = { x: 0, y: 0, width: 0, height: 0, minY: 0, maxY: 0, dir: 1, speed: 0, state: 'drop' };

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
            this.lvl2_pillar = { x: 120, y: 400, width: 50, height: 300, currentY: 400, targetY: 250 };
            this.itemDash = { x: 135, y: 200, width: 20, height: 20, collected: false, color: '#0077ff' };
            this.lvl2_movePlat = { x: 800, y: 250, width: 120, height: 20, minX: 750, maxX: 1050, dir: 1, speed: 2 };
            this.vanishingPlatforms = [
                { x: 1150, y: 250, width: 100, height: 20, touchTimer: -1, visible: true },
                { x: 1350, y: 200, width: 100, height: 20, touchTimer: -1, visible: true }
            ];
            this.lvl2_btn2 = { x: 1950, y: 240, width: 40, height: 10, pressed: false };
            this.lvl2_rescuePlat = { x: 1600, y: 450, width: 250, height: 20, currentY: 450, targetY: 250 };
            
        } else if (level === 3) {
            // --- 🎯 第三關地牢符合手繪圖精準立體配置 ---
            this.goal = { x: 2500, y: 110, width: 30, height: 50, color: '#ff3366' };
            
            // 地形配置
            this.platforms = [
                { x: 0, y: 400, width: 700, height: 50 },        // 起點陸地 (左下)
                
                // 🛠️ 巨型高牆與立體地道構造：
                // 我們用三個矩形在右側拼出一個「包含地道」的巨大結構
                { x: 650, y: 360, width: 1950, height: 90 },     // 1. 地道的下底面
                { x: 850, y: 160, width: 1450, height: 140 },     // 2. 地道的天花板 (也是玩家 B 走的上層平台)
                { x: 2350, y: 160, width: 250, height: 200 },
                { x: 630, y: 160, width: 160, height: 250 },      // 3. 中央直立主巨牆
                
                // 左上方垂下的灰色牆 (與巨牆間留有 60px 的夾縫，供玩家B往上爬)
                { x: 460, y: 0, width: 40, height: 350 }         
            ];

            // 道具與按鈕 (按鈕放在中央巨牆剛爬上去的頂端 y:200)
            this.itemClaw = { x: 150, y: 370, width: 20, height: 20, collected: false, color: '#ff00ff' };
            this.lvl3_btn = { x: 680, y: 150, width: 40, height: 10, pressed: false }; // 長方形紅色按鈕
            
            // 隱藏木橋：升起後剛好連線 700~900 的大洞
            this.lvl3_hiddenBridge = { x: 500, y: 400, width: 130, height: 15, currentY: 400, targetY: 160 };
            
            // 地刺配置（根據你的圖：左下起點兩個、上層平台天花板兩個）
            this.spikes = [
                { x: 300, y: 380, width: 30, height: 20 },
                { x: 330, y: 380, width: 30, height: 20 },
                
                // 玩家 B 在上層平台會遇到的地刺 (y:200 的平台面上，地刺 y 為 180)
                { x: 1200, y: 140, width: 30, height: 20 },
                { x: 2000, y: 140, width: 30, height: 20 }
            ];

            // 巡邏怪物（紫色圓形）：放在上層平台 (玩家 B 的路線，y: 170)
            this.monster = { x: 1600, y: 130, width: 30, height: 30, minX: 1300, maxX: 1900, dir: 1, speed: 1.5 };

            // 壓扁機關（藍色框）：放在下層地道內 (玩家 A 的路線！地道空間 y 軸在 240~400 之間)
            // 🛠️ 調整高度與大小，讓它在地下道內規律砸下
            this.crusher = { x: 1400, y: 200, width: 80, height: 80, minY: 200, maxY: 280, dir: 1, speed: 2, state: 'drop' };
        }
    }

    // 🛠️ 核心修正：將所有參數列完全補齊 (sw1, sw2, 本地玩家, 遠端玩家, 互動回呼, 扣血回呼)
    updateMechanics(sw1Pressed, sw2Pressed, localPlayer, remotePlayers, onInteract, onHurt) {
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

            if (this.lvl2_btn1.pressed) {
                if (this.lvl2_pillar.currentY > this.lvl2_pillar.targetY) this.lvl2_pillar.currentY -= 2;
            } else {
                if (this.lvl2_pillar.currentY < 400) this.lvl2_pillar.currentY += 2;
            }
            this.lvl2_pillar.y = this.lvl2_pillar.currentY;

            // 確保升降梯跟隨
            if (this.checkOverlap(localPlayer, this.lvl2_pillar) && localPlayer.vy >= 0) {
                localPlayer.y = this.lvl2_pillar.y - localPlayer.height;
                localPlayer.vy = 0;
                localPlayer.isGrounded = true;
            }

            this.lvl2_movePlat.x += this.lvl2_movePlat.speed * this.lvl2_movePlat.dir;
            if (this.lvl2_movePlat.x >= this.lvl2_movePlat.maxX || this.lvl2_movePlat.x <= this.lvl2_movePlat.minX) this.lvl2_movePlat.dir *= -1;

            this.vanishingPlatforms.forEach((p, index) => {
                if (p.visible) {
                    // 1. 檢查本地玩家有沒有踩在上面（或座標在平台區間內）
                    let localTouch = this.checkOverlap(localPlayer, p) || 
                                    (localPlayer.x + localPlayer.width > p.x && 
                                    localPlayer.x < p.x + p.width && 
                                    Math.abs((localPlayer.y + localPlayer.height) - p.y) < 5);

                    // 2. 檢查遠端玩家有沒有任何人踩在上面
                    let remoteTouch = false;
                    for (let id in remotePlayers) {
                        let rp = remotePlayers[id];
                        // 模擬遠端玩家的矩形 (通常寬30高30)
                        let rpRect = { x: rp.x, y: rp.y, width: 30, height: 30 };
                        if (this.checkOverlap(rpRect, p) || 
                            (rp.x + 30 > p.x && rp.x < p.x + p.width && Math.abs((rp.y + 30) - p.y) < 5)) {
                            remoteTouch = true;
                        }
                    }

                    // 3. 只要任何一端踩到，立刻啟動本地倒數，各自抹除狀態！
                    if ((localTouch || remoteTouch) && p.touchTimer === -1) {
                        p.touchTimer = 45; // 0.75秒倒數
                    }

                    if (p.touchTimer > 0) {
                        p.touchTimer--;
                        if (p.touchTimer === 0) {
                            p.visible = false; // 時間到，強制隱形並移除碰撞！
                        }
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
        else if (this.currentLevel === 3) {
            // --- 🎯 第三關地牢機關更新 ---
            this.lvl3_btn.pressed = sw1Pressed; 

            if (this.lvl3_btn.pressed) {
                if (this.lvl3_hiddenBridge.currentY > this.lvl3_hiddenBridge.targetY) this.lvl3_hiddenBridge.currentY -= 2;
            } else {
                if (this.lvl3_hiddenBridge.currentY < 400) this.lvl3_hiddenBridge.currentY += 2;
            }
            this.lvl3_hiddenBridge.y = this.lvl3_hiddenBridge.currentY;

            // 確保升降梯跟隨
            if (this.checkOverlap(localPlayer, this.lvl3_hiddenBridge) && localPlayer.vy >= 0) {
                localPlayer.y = this.lvl3_hiddenBridge.y - localPlayer.height;
                localPlayer.vy = 0;
                localPlayer.isGrounded = true;
            }

            this.monster.x += this.monster.speed * this.monster.dir;
            if (this.monster.x >= this.monster.maxX || this.monster.x <= this.monster.minX) this.monster.dir *= -1;

            if (this.crusher.state === 'drop') {
                this.crusher.y += this.crusher.speed * 1.5;
                if (this.crusher.y >= this.crusher.maxY) this.crusher.state = 'raise';
            } else {
                this.crusher.y -= this.crusher.speed * 0.3;
                if (this.crusher.y <= this.crusher.minY) this.crusher.state = 'drop';
            }

            this.activePlatforms = [...this.platforms, this.lvl3_hiddenBridge, this.crusher];
            if (this.lvl3_btn.pressed && this.lvl3_hiddenBridge.currentY <= this.lvl3_hiddenBridge.targetY + 10) {
                this.activePlatforms.push(this.lvl3_hiddenBridge);
            }

            // 傷害判定
            let touchedHazard = false;
            this.spikes.forEach(s => { if (this.checkOverlap(localPlayer, s)) touchedHazard = true; });
            if (this.checkOverlap(localPlayer, this.monster)) touchedHazard = true;
            if (this.checkOverlap(localPlayer, this.crusher) && localPlayer.isGrounded) touchedHazard = true;

            if (touchedHazard && onHurt) onHurt();

            if (!this.itemClaw.collected && this.checkOverlap(localPlayer, this.itemClaw)) {
                this.itemClaw.collected = true;
                localPlayer.hasClaw = true;
                onInteract({ type: 'item_claw_collected' });
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
            ctx.fillStyle = this.switch1.pressed ? '#00ff00' : '#ff3333'; ctx.fillRect(this.switch1.x, this.switch1.y, this.switch1.width, this.switch1.height);
            ctx.fillStyle = this.switch2.pressed ? '#00ff00' : '#ff3333'; ctx.fillRect(this.switch2.x, this.switch2.y, this.switch2.width, this.switch2.height);
            if (this.gate1.closed) { ctx.fillStyle = '#888'; ctx.fillRect(this.gate1.x, this.gate1.y, this.gate1.width, this.gate1.height); }
            ctx.fillStyle = '#666'; ctx.fillRect(this.movingPlatform.x, this.movingPlatform.y, this.movingPlatform.width, this.movingPlatform.height);
            if (!this.itemDoubleJump.collected) { 
                ctx.fillStyle = this.itemDoubleJump.color; ctx.fillRect(this.itemDoubleJump.x, this.itemDoubleJump.y, this.itemDoubleJump.width, this.itemDoubleJump.height); 
                ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.fillText("Double Jump", this.itemDoubleJump.x - 15, this.itemDoubleJump.y - 5);
            }
        } 
        else if (this.currentLevel === 2) {
            ctx.fillStyle = '#555'; ctx.fillRect(this.lvl2_pillar.x, this.lvl2_pillar.currentY, this.lvl2_pillar.width, this.lvl2_pillar.height);
            ctx.fillStyle = this.lvl2_btn1.pressed ? '#00ff00' : '#ff3333'; ctx.fillRect(this.lvl2_btn1.x, this.lvl2_btn1.y, this.lvl2_btn1.width, this.lvl2_btn1.height);
            ctx.fillStyle = '#666'; ctx.fillRect(this.lvl2_movePlat.x, this.lvl2_movePlat.y, this.lvl2_movePlat.width, this.lvl2_movePlat.height);

            this.vanishingPlatforms.forEach(p => {
                if (p.visible) {
                    ctx.fillStyle = p.touchTimer > 0 ? '#ffaa44' : '#775577';
                    ctx.fillRect(p.x, p.y, p.width, p.height);
                }
            });

            ctx.fillStyle = this.lvl2_btn2.pressed ? '#00ff00' : '#ff3333'; ctx.fillRect(this.lvl2_btn2.x, this.lvl2_btn2.y, this.lvl2_btn2.width, this.lvl2_btn2.height);
            ctx.fillStyle = '#3a6f54'; ctx.fillRect(this.lvl2_rescuePlat.x, this.lvl2_rescuePlat.currentY, this.lvl2_rescuePlat.width, this.lvl2_rescuePlat.height);

            if (!this.itemDash.collected) {
                ctx.fillStyle = this.itemDash.color; ctx.fillRect(this.itemDash.x, this.itemDash.y, this.itemDash.width, this.itemDash.height);
                ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.fillText("DASH (按E)", this.itemDash.x - 15, this.itemDash.y - 5);
            }
        }
        else if (this.currentLevel === 3) {
            ctx.fillStyle = '#ff3333';
            this.spikes.forEach(s => {
                ctx.beginPath(); ctx.moveTo(s.x, s.y + s.height); ctx.lineTo(s.x + s.width / 2, s.y); ctx.lineTo(s.x + s.width, s.y + s.height); ctx.closePath(); ctx.fill();
            });
            ctx.fillStyle = '#9933ff'; ctx.fillRect(this.monster.x, this.monster.y, this.monster.width, this.monster.height);
            ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.fillText("👾 怪物", this.monster.x - 2, this.monster.y - 5);
            ctx.fillStyle = '#77aaee'; ctx.fillRect(this.crusher.x, this.crusher.y, this.crusher.width, this.crusher.height);
            ctx.fillStyle = 'black'; ctx.font = '12px sans-serif'; ctx.fillText("⚠️ 壓扁", this.crusher.x + 15, this.crusher.y + 50);
            ctx.fillStyle = '#8b5a2b'; ctx.fillRect(this.lvl3_hiddenBridge.x, this.lvl3_hiddenBridge.currentY, this.lvl3_hiddenBridge.width, this.lvl3_hiddenBridge.height);
            ctx.fillStyle = this.lvl3_btn.pressed ? '#00ff00' : '#ff3333'; ctx.fillRect(this.lvl3_btn.x, this.lvl3_btn.y, this.lvl3_btn.width, this.lvl3_btn.height);
            if (!this.itemClaw.collected) { ctx.fillStyle = this.itemClaw.color; ctx.fillRect(this.itemClaw.x, this.itemClaw.y, this.itemClaw.width, this.itemClaw.height); ctx.fillStyle = 'white'; ctx.font = '10px sans-serif'; ctx.fillText("攀爬爪", this.itemClaw.x - 5, this.itemClaw.y - 5); }
        }

        ctx.fillStyle = this.goal.color;
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    }
}