const WallTool = {
    startX: 0,
    startY: 0,

    handleMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);
        this.startX = snapped.x;
        this.startY = snapped.y;

        Store.previewObject = {
            type: 'wall',
            x1: snapped.x,
            y1: snapped.y,
            x2: snapped.x,
            y2: snapped.y,
            thickness: 12
        };
    },

    handleMouseMove(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'wall') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);
        Store.previewObject.x2 = snapped.x;
        Store.previewObject.y2 = snapped.y;
    },

    handleMouseUp(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'wall') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        const dx = snapped.x - this.startX;
        const dy = snapped.y - this.startY;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length >= 10) {
            const wall = {
                id: Store.generateId('wall'),
                type: 'wall',
                x1: this.startX,
                y1: this.startY,
                x2: snapped.x,
                y2: snapped.y,
                thickness: 12,
                createdAt: Date.now()
            };
            CommandManager.execute(new CreateObjectCommand(wall));
            Store.selectObject(wall.id, 'wall');
        }

        Store.previewObject = null;
    }
};
