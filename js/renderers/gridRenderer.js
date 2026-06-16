const GridRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-grid');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    render() {
        const ctx = this.ctx;
        const { width, height, scale, offsetX, offsetY, gridSize } = Store.canvas;

        ctx.clearRect(0, 0, width, height);

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;

        const startScreenX = 0;
        const startScreenY = 0;
        const endScreenX = width;
        const endScreenY = height;

        const startWorld = Coordinates.screenToWorld(startScreenX, startScreenY);
        const endWorld = Coordinates.screenToWorld(endScreenX, endScreenY);

        const gridStartX = Math.floor(startWorld.x / gridSize) * gridSize;
        const gridStartY = Math.floor(startWorld.y / gridSize) * gridSize;
        const gridEndX = Math.ceil(endWorld.x / gridSize) * gridSize;
        const gridEndY = Math.ceil(endWorld.y / gridSize) * gridSize;

        ctx.beginPath();
        for (let x = gridStartX; x <= gridEndX; x += gridSize) {
            const screenPos = Coordinates.worldToScreen(x, 0);
            ctx.moveTo(screenPos.x, startScreenY);
            ctx.lineTo(screenPos.x, endScreenY);
        }
        for (let y = gridStartY; y <= gridEndY; y += gridSize) {
            const screenPos = Coordinates.worldToScreen(0, y);
            ctx.moveTo(startScreenX, screenPos.y);
            ctx.lineTo(endScreenX, screenPos.y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 1;

        const boldGridSize = gridSize * 5;
        const boldStartX = Math.floor(startWorld.x / boldGridSize) * boldGridSize;
        const boldStartY = Math.floor(startWorld.y / boldGridSize) * boldGridSize;
        const boldEndX = Math.ceil(endWorld.x / boldGridSize) * boldGridSize;
        const boldEndY = Math.ceil(endWorld.y / boldGridSize) * boldGridSize;

        ctx.beginPath();
        for (let x = boldStartX; x <= boldEndX; x += boldGridSize) {
            const screenPos = Coordinates.worldToScreen(x, 0);
            ctx.moveTo(screenPos.x, startScreenY);
            ctx.lineTo(screenPos.x, endScreenY);
        }
        for (let y = boldStartY; y <= boldEndY; y += boldGridSize) {
            const screenPos = Coordinates.worldToScreen(0, y);
            ctx.moveTo(startScreenX, screenPos.y);
            ctx.lineTo(endScreenX, screenPos.y);
        }
        ctx.stroke();

        const centerScreen = Coordinates.worldToScreen(0, 0);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(centerScreen.x, startScreenY);
        ctx.lineTo(centerScreen.x, endScreenY);
        ctx.moveTo(startScreenX, centerScreen.y);
        ctx.lineTo(endScreenX, centerScreen.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
};
