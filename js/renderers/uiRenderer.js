const UIRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-ui');
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

        if (Store.selection.objectId) {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj) {
                if (obj.type === 'furniture' || obj.type === 'text') {
                    this.drawSelectionHandles(ctx, obj);
                } else if (obj.type === 'wall') {
                    this.drawWallSelection(ctx, obj);
                } else if (obj.type === 'dimension') {
                    this.drawDimensionSelection(ctx, obj);
                }
            }
        }
    },

    drawSelectionHandles(ctx, obj) {
        const corners = Coordinates.getObjectCorners(obj);
        const scale = Store.canvas.scale;

        if (corners.length !== 4) return;

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);

        ctx.beginPath();
        ctx.moveTo(screenCorners[0].x, screenCorners[0].y);
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(screenCorners[i].x, screenCorners[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        const edges = [
            { x: (screenCorners[0].x + screenCorners[1].x) / 2, y: (screenCorners[0].y + screenCorners[1].y) / 2 },
            { x: screenCorners[1].x, y: screenCorners[1].y },
            { x: (screenCorners[1].x + screenCorners[2].x) / 2, y: (screenCorners[1].y + screenCorners[2].y) / 2 },
            { x: screenCorners[2].x, y: screenCorners[2].y },
            { x: (screenCorners[2].x + screenCorners[3].x) / 2, y: (screenCorners[2].y + screenCorners[3].y) / 2 },
            { x: screenCorners[3].x, y: screenCorners[3].y },
            { x: (screenCorners[3].x + screenCorners[0].x) / 2, y: (screenCorners[3].y + screenCorners[0].y) / 2 },
            { x: screenCorners[0].x, y: screenCorners[0].y }
        ];

        const handleSize = 8 * scale;

        edges.forEach((pos, i) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(
                pos.x - handleSize / 2,
                pos.y - handleSize / 2,
                handleSize,
                handleSize,
                2 * scale
            );
            ctx.fill();
            ctx.stroke();
        });

        const rotateHandleSize = 10 * scale;
        const centerScreen = Coordinates.worldToScreen(obj.x, obj.y);
        const handleY = centerScreen.y - Coordinates.worldDistanceToScreen(obj.height / 2 + 30);

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, centerScreen.y - Coordinates.worldDistanceToScreen(obj.height / 2));
        ctx.lineTo(centerScreen.x, handleY - rotateHandleSize);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerScreen.x, handleY, rotateHandleSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(centerScreen.x, handleY, rotateHandleSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
    },

    drawWallSelection(ctx, wall) {
        const start = Coordinates.worldToScreen(wall.x1, wall.y1);
        const end = Coordinates.worldToScreen(wall.x2, wall.y2);
        const thickness = Coordinates.worldDistanceToScreen(wall.thickness);
        const scale = Store.canvas.scale;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const nx = -dy / len * thickness / 2;
        const ny = dx / len * thickness / 2;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(start.x + nx, start.y + ny);
        ctx.lineTo(end.x + nx, end.y + ny);
        ctx.lineTo(end.x - nx, end.y - ny);
        ctx.lineTo(start.x - nx, start.y - ny);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        const handleSize = 8 * scale;
        const endpoints = [start, end];

        endpoints.forEach(pos => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(
                pos.x - handleSize / 2,
                pos.y - handleSize / 2,
                handleSize,
                handleSize,
                2 * scale
            );
            ctx.fill();
            ctx.stroke();
        });
    },

    drawDimensionSelection(ctx, dim) {
        const start = Coordinates.worldToScreen(dim.x1, dim.y1);
        const end = Coordinates.worldToScreen(dim.x2, dim.y2);
        const scale = Store.canvas.scale;

        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const handleSize = 8 * scale;
        const endpoints = [start, end];

        endpoints.forEach(pos => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(
                pos.x - handleSize / 2,
                pos.y - handleSize / 2,
                handleSize,
                handleSize,
                2 * scale
            );
            ctx.fill();
            ctx.stroke();
        });
    }
};
