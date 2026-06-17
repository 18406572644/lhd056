const WallRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-walls');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const drawWalls = (objects) => {
            objects.forEach(obj => {
                if (obj.type === 'wall') {
                    this.drawWall(ctx, obj);
                } else if (obj.type === 'group' && obj.children) {
                    drawWalls(obj.children);
                }
            });
        };

        drawWalls(Store.objects);

        if (Store.previewObject && Store.previewObject.type === 'wall') {
            this.drawWall(ctx, Store.previewObject, true);
        }

        if (Store.previewObject && Store.previewObject.type === 'room') {
            this.drawRoomPreview(ctx, Store.previewObject);
        }
    },

    drawWall(ctx, wall, isPreview = false) {
        const start = Coordinates.worldToScreen(wall.x1, wall.y1);
        const end = Coordinates.worldToScreen(wall.x2, wall.y2);
        const thickness = Coordinates.worldDistanceToScreen(wall.thickness);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return;

        const nx = -dy / len * thickness / 2;
        const ny = dx / len * thickness / 2;

        if (isPreview) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(start.x + nx, start.y + ny);
            ctx.lineTo(end.x + nx, end.y + ny);
            ctx.lineTo(end.x - nx, end.y - ny);
            ctx.lineTo(start.x - nx, start.y - ny);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(start.x + nx, start.y + ny);
            ctx.lineTo(end.x + nx, end.y + ny);
            ctx.lineTo(end.x - nx, end.y - ny);
            ctx.lineTo(start.x - nx, start.y - ny);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    },

    drawRoomPreview(ctx, room) {
        const thickness = Coordinates.worldDistanceToScreen(12);

        const corners = [
            { x: room.x1, y: room.y1 },
            { x: room.x2, y: room.y1 },
            { x: room.x2, y: room.y2 },
            { x: room.x1, y: room.y2 }
        ];

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
            const start = screenCorners[i];
            const end = screenCorners[(i + 1) % 4];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;

            const nx = -dy / len * thickness / 2;
            const ny = dx / len * thickness / 2;

            ctx.beginPath();
            ctx.moveTo(start.x + nx, start.y + ny);
            ctx.lineTo(end.x + nx, end.y + ny);
            ctx.lineTo(end.x - nx, end.y - ny);
            ctx.lineTo(start.x - nx, start.y - ny);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }
};
