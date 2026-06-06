import { PlayerManager } from './player.js';
import { MapManager } from './map.js';
import { NetworkManager } from './network.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.keys = {};
        this.camera = { x: 0 };
        this.isPlaying = false;
        this.username = "";
        this.roomId = "";

        // 儲存所有人的開關狀態
        this.remoteSwitches1 = {};
        this.remoteSwitches2 = {};

        this.doms = {
            auth: document.getElementById('authOverlay'),
            lobby: document.getElementById('lobbyOverlay'),
            room: document.getElementById('roomOverlay'),
            userInp: document.getElementById('username'),
            passInp: document.getElementById('password'),
            roomInp: document.getElementById('roomId'),
            playerList: document.getElementById('playerList'),
            roomTitle: document.getElementById('roomTitle'),
            btnStart: document.getElementById('btnStartGame'),
            waitMsg: document.getElementById('waitHostMsg')
        };

        this.networkMgr = new NetworkManager(
            (info) => this.handleRoomInfo(info),
            (id, data) => this.handleRemoteSync(id, data),
            (id) => this.playerMgr.removeRemote(id),
            () => this.startActualGame(),
            (res) => this.handleGameResult(res)
        );

        this.initUiEvents();
    }

    initUiEvents() {
        document.getElementById('btnLogin').onclick = async () => {
            this.username = this.doms.userInp.value;
            let res = await this.networkMgr.login(this.username, this.doms.passInp.value);
            if(res.success) {
                this.doms.auth.classList.add('hidden');
                this.doms.lobby.classList.remove('hidden');
                this.playerMgr = new PlayerManager(this.username);
            } else alert(res.msg);
        };

        document.getElementById('btnRegister').onclick = async () => {
            let res = await this.networkMgr.register(this.doms.userInp.value, this.doms.passInp.value);
            alert(res.msg);
        };

        document.getElementById('btnJoinRoom').onclick = () => {
            this.roomId = this.doms.roomInp.value;
            if(!this.roomId) return alert("請輸入房間 ID");
            this.doms.lobby.classList.add('hidden');
            this.doms.room.classList.remove('hidden');
            this.doms.roomTitle.innerText = `房間代碼: ${this.roomId}`;
            this.networkMgr.connectRoom(this.roomId, this.username);
        };

        this.doms.btnStart.onclick = () => {
            this.networkMgr.send({ type: 'start_game' });
        };

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            if (this.isPlaying) this.playerMgr.handleKeyDown(e.code);
        });
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }

    handleRoomInfo(info) {
        this.doms.playerList.innerHTML = "";
        info.members.forEach(m => {
            let div = document.createElement('div');
            div.className = `player-item ${m === info.host ? 'host' : ''}`;
            div.innerText = m;
            this.doms.playerList.appendChild(div);
        });

        if (info.host === this.username) {
            this.doms.btnStart.classList.remove('hidden');
            this.doms.waitMsg.classList.add('hidden');
        } else {
            this.doms.btnStart.classList.add('hidden');
            this.doms.waitMsg.classList.remove('hidden');
        }
    }

    startActualGame() {
        this.doms.room.classList.add('hidden');
        this.canvas.style.display = 'block';
        this.mapMgr = new MapManager();
        
        // 🛠️ 修正一：開始時強制重置血量、二段跳能力與位置
        this.playerMgr.resetStatus(); 
        this.remoteSwitches1 = {};
        this.remoteSwitches2 = {};
        
        this.isPlaying = true;
        this.gameLoop();
    }

    handleRemoteSync(id, data) {
        if (!this.isPlaying) return;
        
        if (data.type === 'update') {
            this.playerMgr.updateRemote(id, data.x, data.y);
            // 同步遠端玩家的兩個按鈕狀態
            if (data.sw1 !== undefined) this.remoteSwitches1[id] = data.sw1;
            if (data.sw2 !== undefined) this.remoteSwitches2[id] = data.sw2;
        }
        
        if (data.type === 'interact' && data.action === 'item_collected') {
            this.mapMgr.itemDoubleJump.collected = true;
        }
    }

    handleGameResult(res) {
        this.isPlaying = false;
        this.canvas.style.display = 'none';
        this.doms.room.classList.remove('hidden');
        
        if (res.status === 'success') {
            alert(`🏆 全隊過關！通關關卡: 第 ${res.level} 關\n⏱️ 全隊總耗時: ${res.time} 秒！`);
        } else {
            alert(`❌ 挑戰失敗！有玩家生命值歸零。`);
        }
    }

    gameLoop() {
        if (!this.isPlaying) return;
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        let lp = this.playerMgr.localPlayer;

        // 1. 判定本地玩家有沒有踩在按鈕一或按鈕二上
        let mySw1 = this.mapMgr.checkOverlap(lp, this.mapMgr.switch1);
        let mySw2 = this.mapMgr.checkOverlap(lp, this.mapMgr.switch2);
        
        // 2. 整合房間內所有人的按鈕狀態
        let globalSw1 = mySw1;
        let globalSw2 = mySw2;
        for (let id in this.remoteSwitches1) if (this.remoteSwitches1[id]) globalSw1 = true;
        for (let id in this.remoteSwitches2) if (this.remoteSwitches2[id]) globalSw2 = true;

        // 3. 運行地圖機關與碰撞
        this.mapMgr.updateMechanics(globalSw1, globalSw2, lp, (evt) => {
            this.networkMgr.send({ type: 'interact', action: 'item_collected' });
        });

        // 4. 運行本地玩家移動物理
        this.playerMgr.update(
            this.keys, this.mapMgr.activePlatforms, this.canvas.height,
            (currentHp) => {
                if(currentHp <= 0) {
                    this.networkMgr.send({ type: 'game_over', status: 'fail' });
                }
            },
            (x, y, hp) => {
                // 傳送座標的同時，把兩個按鈕的狀態一起噴出去
                this.networkMgr.send({ 
                    type: 'update', x, y, hp, sw1: mySw1, sw2: mySw2 
                });
            }
        );

        // 🛠️ 修正二：核心通關邏輯——必須兩人都超越終點線才算過關
        let amIGoal = lp.x >= this.mapMgr.goal.x;
        let everyoneGoal = amIGoal;

        // 檢查是不是房間內的所有隊友也都過線了
        for (let id in this.playerMgr.remotePlayers) {
            if (this.playerMgr.remotePlayers[id].x < this.mapMgr.goal.x) {
                everyoneGoal = false; 
            }
        }

        // 只有在在線人數大於 0 且全員到齊時，才發送通關
        if (everyoneGoal && Object.keys(this.playerMgr.remotePlayers).length > 0) {
            this.networkMgr.send({ type: 'game_over', status: 'success' });
        }

        this.camera.x = lp.x - this.canvas.width / 3;
        if (this.camera.x < 0) this.camera.x = 0;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        this.ctx.translate(-this.camera.x, 0);
        
        this.mapMgr.draw(this.ctx);
        this.playerMgr.draw(this.ctx);
        
        this.ctx.restore();
        this.playerMgr.drawHearts(this.ctx);
    }
}

new Game();