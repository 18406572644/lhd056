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

            const wallData = [
                { x1: x1, y1: y1, x2: x2, y2: y1 },
                { x1: x2, y1: y1, x2: x2, y2: y2 },
                { x1: x2, y1: y2, x2: x1, y2: y2 },
                { x1: x1, y1: y2, x2: x1, y2: y1 }
            ];

            const newWallIds = [];
            const commands = wallData.map(w => {
                const wall = {
                    id: Store.generateId('wall'),
                    type: 'wall',
                    x1: w.x1,
                    y1: w.y1,
                    x2: w.x2,
                    y2: w.y2,
                    thickness: 12,
                    createdAt: Date.now()
                };
                newWallIds.push(wall.id);
                return new CreateObjectCommand(wall);
            });

            class CreateRoomWallsCommand extends Command {
                constructor(createCommands, wallIds) {
                    super();
                    this.createCommands = createCommands;
                    this.wallIds = wallIds;
                    this.oldConnections = null;
                    this.newConnections = null;
                }
                execute() {
                    this.createCommands.forEach(cmd => cmd.execute());
                    if (typeof WallConnection !== 'undefined') {
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
                        this.oldConnections = {};
                        walls.forEach(w => {
                            this.oldConnections[w.id] = {
                                startConnection: w.startConnection ? JSON.parse(JSON.stringify(w.startConnection)) : undefined,
                                endConnection: w.endConnection ? JSON.parse(JSON.stringify(w.endConnection)) : undefined
                            };
                        });
                        WallConnection.updateAllWallConnections();
                        this.newConnections = {};
                        walls.forEach(w => {
                            this.newConnections[w.id] = {
                                startConnection: w.startConnection ? JSON.parse(JSON.stringify(w.startConnection)) : undefined,
                                endConnection: w.endConnection ? JSON.parse(JSON.stringify(w.endConnection)) : undefined
                            };
                        });
                    }
                }
                undo() {
                    for (let i = this.createCommands.length - 1; i >= 0; i--) {
                        this.createCommands[i].undo();
                    }
                    if (this.oldConnections) {
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
                        walls.forEach(w => {
                            if (this.oldConnections[w.id]) {
                                const conn = this.oldConnections[w.id];
                                if (conn.startConnection !== undefined) {
                                    if (conn.startConnection) {
                                        w.startConnection = JSON.parse(JSON.stringify(conn.startConnection));
                                    } else {
                                        delete w.startConnection;
                                    }
                                }
                                if (conn.endConnection !== undefined) {
                                    if (conn.endConnection) {
                                        w.endConnection = JSON.parse(JSON.stringify(conn.endConnection));
                                    } else {
                                        delete w.endConnection;
                                    }
                                }
                            }
                        });
                    }
                }
                redo() {
                    this.createCommands.forEach(cmd => cmd.redo ? cmd.redo() : cmd.execute());
                    if (this.newConnections) {
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
                        walls.forEach(w => {
                            if (this.newConnections[w.id]) {
                                const conn = this.newConnections[w.id];
                                if (conn.startConnection !== undefined) {
                                    if (conn.startConnection) {
                                        w.startConnection = JSON.parse(JSON.stringify(conn.startConnection));
                                    } else {
                                        delete w.startConnection;
                                    }
                                }
                                if (conn.endConnection !== undefined) {
                                    if (conn.endConnection) {
                                        w.endConnection = JSON.parse(JSON.stringify(conn.endConnection));
                                    } else {
                                        delete w.endConnection;
                                    }
                                }
                            }
                        });
                    }
                }
            }

            CommandManager.execute(new CreateRoomWallsCommand(commands, newWallIds));
        }

        Store.previewObject = null;
    }
};
