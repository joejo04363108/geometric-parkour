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
        this.selectedLevel = 1; // 預設第一關

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
            waitMsg: document.getElementById('waitHostMsg'),
            lvl2Btn: document.getElementById('lvl2Btn') // 第二關按鈕
        };

        this.networkMgr = new NetworkManager(
            (info) => this.handleRoomInfo(info),
            (id, data) => this.handleRemoteSync(id, data),
            (id) => this.playerMgr.removeRemote(id),
            () => this.startActualGame(),
            (res) => this.handleGameResult(res)
        );
                // 綁定遠端關卡切換事件
        this.networkMgr.onLevelChanged = (lvl) => {
            this.selectedLevel = lvl;
            document.querySelectorAll('.level-btn').forEach(b => {
                b.classList.remove('active');
                if (parseInt(b.getAttribute('data-level')) === lvl) b.classList.add('active');
            });
        };

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

        // 監聽關卡選擇按鈕
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.onclick = (e) => {
                // 只有房主能選關卡
                document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedLevel = parseInt(e.target.getAttribute('data-level'));
                this.networkMgr.send({ type: 'change_level', level: this.selectedLevel });
            };
        });

        this.doms.btnStart.onclick = () => {
            this.networkMgr.send({ type: 'start_game' });
        };

        window.addEventListener('keydown', e => {
            this.keys[e.code] = true;
            // 🔥 關鍵修正：將整個 keys 傳入，方便判定組合鍵 E + A/D
            if (this.isPlaying) this.playerMgr.handleKeyDown(e.code, this.keys);
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

        // 同步非房主的關卡外觀顯示
        this.selectedLevel = info.level;
        document.querySelectorAll('.level-btn').forEach(b => {
            b.classList.remove('active');
            if (parseInt(b.getAttribute('data-level')) === info.level) b.classList.add('active');
        });

        if (info.host === this.username) {
            this.doms.btnStart.classList.remove('hidden');
            this.doms.waitMsg.classList.add('hidden');
            this.doms.lvl2Btn.removeAttribute('disabled'); // 房主解鎖關卡選單
        } else {
            this.doms.btnStart.classList.add('hidden');
            this.doms.waitMsg.classList.remove('hidden');
        }
    }

    startActualGame() {
        this.doms.room.classList.add('hidden');
        this.canvas.style.display = 'block';
        
        // 🔥 解決 Bug 1：強制清空所有按鍵狀態，防止自動走動
        this.keys = {}; 
        
        this.mapMgr = new MapManager();
        this.mapMgr.initLevel(this.selectedLevel);
        
        // 🔥 解決 Bug 2：確保玩家經理將血量完整重置為 3，Dash 與跳躍重置
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
            if (data.sw1 !== undefined) this.remoteSwitches1[id] = data.sw1;
            if (data.sw2 !== undefined) this.remoteSwitches2[id] = data.sw2;
        }
        
        if (data.type === 'interact') {
            if (data.action === 'item_collected') this.mapMgr.itemDoubleJump.collected = true;
            if (data.action === 'item_dash_collected') this.mapMgr.itemDash.collected = true;
        }
    }

    handleGameResult(res) {
        this.isPlaying = false;
        this.canvas.style.display = 'none';
        this.doms.room.classList.remove('hidden');
        
        if (res.status === 'success') {
            alert(`🏆 全隊過關！通關關卡: 第 ${res.level} 關\n⏱️ 全隊總耗時: ${res.time} 秒！`);
            // 🔥 過第一關後，開啟第二關的選擇權限
            if (res.level === 1) {
                this.doms.lvl2Btn.removeAttribute('disabled');
            }
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

        // 根據關卡抓取對應按鈕的重疊狀態
        let mySw1 = false;
        let mySw2 = false;
        if (this.selectedLevel === 1) {
            mySw1 = this.mapMgr.checkOverlap(lp, this.mapMgr.switch1);
            mySw2 = this.mapMgr.checkOverlap(lp, this.mapMgr.switch2);
        } else if (this.selectedLevel === 2) {
            mySw1 = this.mapMgr.checkOverlap(lp, this.mapMgr.lvl2_btn1);
            mySw2 = this.mapMgr.checkOverlap(lp, this.mapMgr.lvl2_btn2);
        }
        
        let globalSw1 = mySw1;
        let globalSw2 = mySw2;
        for (let id in this.remoteSwitches1) if (this.remoteSwitches1[id]) globalSw1 = true;
        for (let id in this.remoteSwitches2) if (this.remoteSwitches2[id]) globalSw2 = true;

        // game.js 裡的 update() 內部修改：
        this.mapMgr.updateMechanics(globalSw1, globalSw2, lp, 
            this.playerMgr.remotePlayers, // 🔥 新增傳入遠端玩家清單
            (evt) => {
                if(evt.type === 'item_collected') this.networkMgr.send({ type: 'interact', action: 'item_collected' });
                if(evt.type === 'item_dash_collected') this.networkMgr.send({ type: 'interact', action: 'item_dash_collected' });
            }
        );

        this.playerMgr.update(
            this.keys, this.mapMgr.activePlatforms, this.canvas.height,
            (currentHp) => {
                if(currentHp <= 0) this.networkMgr.send({ type: 'game_over', status: 'fail' });
            },
            (x, y, hp) => {
                this.networkMgr.send({ type: 'update', x, y, hp, sw1: mySw1, sw2: mySw2 });
            }
        );

        // 終點精準重疊判定
        let amIGoal = this.mapMgr.checkOverlap(lp, this.mapMgr.goal);
        let everyoneGoal = amIGoal;

        for (let id in this.playerMgr.remotePlayers) {
            let rp = this.playerMgr.remotePlayers[id];
            let remotePlayerRect = { x: rp.x, y: rp.y, width: lp.width, height: lp.height };
            if (!this.mapMgr.checkOverlap(remotePlayerRect, this.mapMgr.goal)) {
                everyoneGoal = false; 
            }
        }

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