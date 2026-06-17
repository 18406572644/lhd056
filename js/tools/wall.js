const WallTool = {
    startX: 0,
    startY: 0,
    startSnapInfo: null,
    endSnapInfo: null,

    handleMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapResult = Snap.snapPointToWallAndGrid(world.x, world.y);
        this.startX = snapResult.x;
        this.startY = snapResult.y;
        this.startSnapInfo = snapResult.wallSnap;

        Store.previewObject = {
            type: 'wall',
            x1: snapResult.x,
            y1: snapResult.y,
            x2: snapResult.x,
            y2: snapResult.y,
            thickness: 12,
            wallHeight: Store.defaultWallHeight,
            _startSnapped: snapResult.snapped,
            _startSnapType: snapResult.snapType,
            _endSnapped: false,
            _endSnapType: 'grid'
        };
    },

    handleMouseMove(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'wall') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapResult = Snap.snapPointToWallAndGrid(world.x, world.y);
        Store.previewObject.x2 = snapResult.x;
        Store.previewObject.y2 = snapResult.y;
        Store.previewObject._endSnapped = snapResult.snapped;
        Store.previewObject._endSnapType = snapResult.snapType;
        this.endSnapInfo = snapResult.wallSnap;
    },

    handleMouseUp(e) {
        if (!Store.previewObject || Store.previewObject.type !== 'wall') return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapResult = Snap.snapPointToWallAndGrid(world.x, world.y);

        const dx = snapResult.x - this.startX;
        const dy = snapResult.y - this.startY;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length >= 10) {
            const wall = {
                id: Store.generateId('wall'),
                type: 'wall',
                x1: this.startX,
                y1: this.startY,
                x2: snapResult.x,
                y2: snapResult.y,
                thickness: 12,
                wallHeight: Store.defaultWallHeight,
                createdAt: Date.now()
            };

            class CreateWallCommand extends Command {
                constructor(wall) {
                    super();
                    this.wall = wall;
                    this.oldConnections = null;
                    this.newConnections = null;
                    this.parentGroupId = null;
                }
                execute() {
                    if (typeof WallConnection !== 'undefined') {
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
                        this.oldConnections = {};
                        walls.forEach(w => {
                            this.oldConnections[w.id] = {
                                startConnection: w.startConnection ? JSON.parse(JSON.stringify(w.startConnection)) : undefined,
                                endConnection: w.endConnection ? JSON.parse(JSON.stringify(w.endConnection)) : undefined
                            };
                        });
                    }

                    Store.addObject(this.wall);
                    this.parentGroupId = null;

                    if (typeof WallConnection !== 'undefined') {
                        WallConnection.updateWallConnections(this.wall);
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
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
                    Store.removeObject(this.wall.id);
                    Store.clearSelection();

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
                    Store.addObject(this.wall);

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

            CommandManager.execute(new CreateWallCommand(wall));
            Store.selectObject(wall.id, 'wall');
        }

        Store.previewObject = null;
        this.startSnapInfo = null;
        this.endSnapInfo = null;
    }
};
