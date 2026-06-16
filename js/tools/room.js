const RoomTool = {
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
            type: 'room',
            x1: snapped.x,
            y1: snapped.y,
            x2: snapped.x,
            y2: snapped.y
        };
    },

    handleMouseMove(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'room') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);
        Store.previewObject.x2 = snapped.x;
        Store.previewObject.y2 = snapped.y;
    },

    handleMouseUp(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'room') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        const width = Math.abs(snapped.x - this.startX);
        const height = Math.abs(snapped.y - this.startY);

        if (width >= 50 && height >= 50) {
            const x1 = Math.min(this.startX, snapped.x);
            const y1 = Math.min(this.startY, snapped.y);
            const x2 = Math.max(this.startX, snapped.x);
            const y2 = Math.max(this.startY, snapped.y);

            const walls = [
                { x1: x1, y1: y1, x2: x2, y2: y1 },
                { x1: x2, y1: y1, x2: x2, y2: y2 },
                { x1: x2, y1: y2, x2: x1, y2: y2 },
                { x1: x1, y1: y2, x2: x1, y2: y1 }
            ];

            const commands = walls.map(w => new CreateObjectCommand({
                id: Store.generateId('wall'),
                type: 'wall',
                x1: w.x1,
                y1: w.y1,
                x2: w.x2,
                y2: w.y2,
                thickness: 12,
                createdAt: Date.now()
            }));

            CommandManager.execute(new CompoundCommand(commands));
        }

        Store.previewObject = null;
    }
};
