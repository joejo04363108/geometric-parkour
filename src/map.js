export class MapManager {
    constructor() {
        this.platforms = [
            { x: 0, y: 400, width: 600, height: 50 },
            { x: 200, y: 300, width: 150, height: 20 },
            { x: 450, y: 220, width: 150, height: 20 },
            { x: 700, y: 350, width: 300, height: 100 },
            { x: 1100, y: 250, width: 200, height: 200 }
        ];
        this.goal = { x: 1250, y: 200, width: 30, height: 50, color: '#ff3366' };
    }

    draw(ctx) {
        ctx.fillStyle = '#444';
        this.platforms.forEach(plat => ctx.fillRect(plat.x, plat.y, plat.width, plat.height));
        ctx.fillStyle = this.goal.color;
        ctx.fillRect(this.goal.x, this.goal.y, this.goal.width, this.goal.height);
    }
}