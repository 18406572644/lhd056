const SelectTool = {
    lastMoveX: 0,
    lastMoveY: 0,
    originalObject: null,
    originalRotation: 0,
    originalWidth: 0,
    originalHeight: 0,
    originalX: 0,
    originalY: 0,

    marqueeStart: null,
    marqueeEnd: null,
    isMarqueeSelecting: false,
    marqueeStartObjects: [],

    lastClickTime: 0,
    lastClickObjectId: null,

    contextMenuObjectId: null,

    wallEndpointDrag: null,
    originalWallsState: null,

    handleMouseDown(e) {
        if (e.button !== 0) return;
        if (Store.panState.isPanning) return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        this.hideContextMenu();

        if (typeof WallConnection !== 'undefined') {
            const wallEndpoint = WallConnection.getWallEndpointAtScreenPoint(screenX, screenY, 10);
            if (wallEndpoint) {
                Store.selectObject(wallEndpoint.wallId, 'wall');
                Store.selection.handleType = 'wallEndpoint';
                Store.selection.wallEndpoint = wallEndpoint.endpoint;
                Store.dragState.isDragging = true;
                Store.dragState.startX = world.x;
                Store.dragState.startY = world.y;
                this.lastMoveX = world.x;
                this.lastMoveY = world.y;
                this.wallEndpointDrag = {
                    wallId: wallEndpoint.wallId,
                    endpoint: wallEndpoint.endpoint,
                    startX: wallEndpoint.worldX,
                    startY: wallEndpoint.worldY
                };
                this.originalWallsState = this._getAllWallsState();
                return;
            }
        }

        if (Store.selection.objectIds.length > 0) {
            const primaryObj = Store.getObject(Store.selection.objectId);
            if (primaryObj && (primaryObj.type === 'furniture' || primaryObj.type === 'text' || primaryObj.type === 'group')) {
                const handle = Collision.hitTestHandle(screenX, screenY, primaryObj);
                if (handle && Store.selection.objectIds.length === 1) {
                    Store.selection.handleType = handle.type;
                    Store.selection.handleIndex = handle.index;
                    Store.dragState.isDragging = true;
                    Store.dragState.startX = world.x;
                    Store.dragState.startY = world.y;
                    this.lastMoveX = world.x;
                    this.lastMoveY = world.y;
                    this.originalObject = JSON.parse(JSON.stringify(primaryObj));
                    this.originalRotation = primaryObj.rotation || 0;
                    this.originalWidth = primaryObj.width;
                    this.originalHeight = primaryObj.height;
                    this.originalX = primaryObj.x;
                    this.originalY = primaryObj.y;
                    return;
                }
            }
        }

        const hitObject = Collision.findObjectAtPoint(world.x, world.y);

        if (hitObject) {
            const now = Date.now();
            if (now - this.lastClickTime < 300 && this.lastClickObjectId === hitObject.id) {
                this.handleDoubleClick(hitObject);
                this.lastClickTime = 0;
                this.lastClickObjectId = null;
                return;
            }
            this.lastClickTime = now;
            this.lastClickObjectId = hitObject.id;

            if (e.shiftKey) {
                Store.toggleSelection(hitObject.id, hitObject.type);
            } else {
                if (!Store.isSelected(hitObject.id)) {
                    Store.selectObject(hitObject.id, hitObject.type);
                }
            }

            if (Store.selection.objectIds.length > 0) {
                Store.dragState.isDragging = true;
                Store.dragState.startX = world.x;
                Store.dragState.startY = world.y;
                Store.dragState.startObjects = Store.selection.objectIds.map(id => {
                    const obj = Store.getObject(id);
                    return obj ? JSON.parse(JSON.stringify(obj)) : null;
                }).filter(Boolean);
                this.lastMoveX = world.x;
                this.lastMoveY = world.y;
                Store.selection.handleType = 'move';
            }
        } else {
            if (!e.shiftKey) {
                Store.clearSelection();
            }

            this.isMarqueeSelecting = true;
            this.marqueeStart = { x: screenX, y: screenY };
            this.marqueeEnd = { x: screenX, y: screenY };
            this.marqueeStartObjects = [...Store.selection.objectIds];
        }
    },

    handleMouseMove(e) {
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        if (this.isMarqueeSelecting) {
            this.marqueeEnd = { x: screenX, y: screenY };

            const worldStart = Coordinates.screenToWorld(this.marqueeStart.x, this.marqueeStart.y);
            const worldEnd = Coordinates.screenToWorld(this.marqueeEnd.x, this.marqueeEnd.y);

            const hitObjects = Collision.findObjectsInRect(worldStart.x, worldStart.y, worldEnd.x, worldEnd.y);
            const hitIds = hitObjects.map(o => o.id);

            if (e.shiftKey) {
                const newSelection = [...this.marqueeStartObjects];
                hitIds.forEach(id => {
                    if (!newSelection.includes(id)) {
                        newSelection.push(id);
                    }
                });
                Store.setSelection(newSelection);
            } else {
                Store.setSelection(hitIds);
            }
            return;
        }

        if (!Store.dragState.isDragging) return;

        if (Store.selection.handleType === 'wallEndpoint' && this.wallEndpointDrag) {
            const snapResult = Snap.snapPointToWallAndGrid(
                world.x, world.y, this.wallEndpointDrag.wallId
            );

            if (typeof WallConnection !== 'undefined') {
                const wall = Store.getObject(this.wallEndpointDrag.wallId);
                if (wall) {
                    const currentX = this.wallEndpointDrag.endpoint === 'start' ? wall.x1 : wall.x2;
                    const currentY = this.wallEndpointDrag.endpoint === 'start' ? wall.y1 : wall.y2;

                    if (currentX !== snapResult.x || currentY !== snapResult.y) {
                        this._restoreWallsState(this.originalWallsState);
                        WallConnection.moveWallEndpoint(
                            this.wallEndpointDrag.wallId,
                            this.wallEndpointDrag.endpoint,
                            snapResult.x,
                            snapResult.y,
                            true
                        );
                    }
                }
            } else {
                const wall = Store.getObject(this.wallEndpointDrag.wallId);
                if (wall) {
                    if (this.wallEndpointDrag.endpoint === 'start') {
                        wall.x1 = snapResult.x;
                        wall.y1 = snapResult.y;
                    } else {
                        wall.x2 = snapResult.x;
                        wall.y2 = snapResult.y;
                    }
                }
            }

            this.lastMoveX = snapResult.x;
            this.lastMoveY = snapResult.y;
            return;
        }

        if (Store.selection.handleType === 'move') {
            const dx = world.x - this.lastMoveX;
            const dy = world.y - this.lastMoveY;

            Store.selection.objectIds.forEach(id => {
                const obj = Store.getObject(id);
                if (obj && obj.type === 'doorWindow' && obj.wallId) {
                    const wall = Store.getObject(obj.wallId);
                    if (wall) {
                        const newX = obj.x + dx;
                        const newY = obj.y + dy;
                        const wallDx = wall.x2 - wall.x1;
                        const wallDy = wall.y2 - wall.y1;
                        const wallLenSq = wallDx * wallDx + wallDy * wallDy;
                        if (wallLenSq > 0) {
                            let t = ((newX - wall.x1) * wallDx + (newY - wall.y1) * wallDy) / wallLenSq;
                            const maxT = 1 - obj.width / Math.sqrt(wallLenSq) / 2;
                            const minT = obj.width / Math.sqrt(wallLenSq) / 2;
                            t = Math.max(minT, Math.min(maxT, t));
                            obj.wallT = t;
                            if (typeof DoorWindowTool !== 'undefined') {
                                DoorWindowTool.updateDoorWindowPosition(obj);
                            }
                        }
                    }
                } else {
                    Store.moveObject(id, dx, dy);
                }
            });

            this.lastMoveX = world.x;
            this.lastMoveY = world.y;
        } else if (Store.selection.handleType === 'resize') {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj) {
                this.handleResize(obj, world);
            }
        } else if (Store.selection.handleType === 'rotate') {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj && obj.type !== 'group') {
                this.handleRotate(obj, screenX, screenY);
            }
        }
    },

    handleMouseUp(e) {
        if (this.isMarqueeSelecting) {
            this.isMarqueeSelecting = false;
            this.marqueeStart = null;
            this.marqueeEnd = null;
            return;
        }

        if (!Store.dragState.isDragging) return;

        if (Store.selection.handleType === 'wallEndpoint' && this.wallEndpointDrag) {
            const newWallsState = this._getAllWallsState();
            const wall = Store.getObject(this.wallEndpointDrag.wallId);

            let hasChanged = false;
            if (wall) {
                const endX = this.wallEndpointDrag.endpoint === 'start' ? wall.x1 : wall.x2;
                const endY = this.wallEndpointDrag.endpoint === 'start' ? wall.y1 : wall.y2;
                hasChanged = (endX !== this.wallEndpointDrag.startX || endY !== this.wallEndpointDrag.startY);
            }

            if (hasChanged) {
                this._restoreWallsState(this.originalWallsState);

                const oldStates = Object.keys(this.originalWallsState).map(id => ({
                    id,
                    ...this.originalWallsState[id]
                }));
                const newStates = Object.keys(newWallsState).map(id => ({
                    id,
                    ...newWallsState[id]
                }));

                CommandManager.execute(new BatchModifyWallsCommand(oldStates, newStates));
            }

            this.wallEndpointDrag = null;
            this.originalWallsState = null;
            Store.dragState.isDragging = false;
            Store.dragState.startObject = null;
            Store.dragState.startObjects = [];
            Store.selection.handleType = null;
            Store.selection.wallEndpoint = null;
            Store.selection.handleIndex = null;
            this.originalObject = null;
            return;
        }

        if (Store.selection.handleType === 'move' && Store.selection.objectIds.length > 0) {
            if (Store.dragState.startObjects.length > 0) {
                const gridSize = Store.canvas.gridSize;
                const moveInfos = [];

                Store.selection.objectIds.forEach((id, idx) => {
                    const obj = Store.getObject(id);
                    const start = Store.dragState.startObjects[idx];
                    if (obj && start) {
                        if (obj.type === 'furniture' || obj.type === 'text') {
                            const snappedX = Snap.snapToGrid(obj.x, gridSize);
                            const snappedY = Snap.snapToGrid(obj.y, gridSize);
                            const dx = snappedX - start.x;
                            const dy = snappedY - start.y;
                            moveInfos.push({ id, dx, dy, type: obj.type });
                        } else if (obj.type === 'group') {
                            const snappedX = Snap.snapToGrid(obj.x, gridSize);
                            const snappedY = Snap.snapToGrid(obj.y, gridSize);
                            const dx = snappedX - start.x;
                            const dy = snappedY - start.y;
                            moveInfos.push({ id, dx, dy, type: 'group' });
                        } else if (obj.type === 'wall' || obj.type === 'dimension') {
                            const dx = obj.x1 - start.x1;
                            const dy = obj.y1 - start.y1;
                            moveInfos.push({ id, dx, dy, type: obj.type });
                        }
                    }
                });

                const hasMoved = moveInfos.some(m => Math.abs(m.dx) > 0.1 || Math.abs(m.dy) > 0.1);

                if (hasMoved) {
                    const hasWalls = Store.selection.objectIds.some(id => {
                        const obj = Store.getObject(id);
                        return obj && obj.type === 'wall';
                    });

                    let oldWallConnections = null;
                    if (hasWalls && typeof WallConnection !== 'undefined') {
                        oldWallConnections = {};
                        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
                        walls.forEach(w => {
                            oldWallConnections[w.id] = {
                                startConnection: w.startConnection ? JSON.parse(JSON.stringify(w.startConnection)) : undefined,
                                endConnection: w.endConnection ? JSON.parse(JSON.stringify(w.endConnection)) : undefined
                            };
                        });
                    }

                    Store.dragState.startObjects.forEach((start, idx) => {
                        const id = Store.selection.objectIds[idx];
                        const obj = Store.getObject(id);
                        if (obj && start) {
                            if (obj.type === 'group') {
                                const dx = start.x - obj.x;
                                const dy = start.y - obj.y;
                                Store.moveObject(id, dx, dy);
                            } else if (obj.type === 'furniture' || obj.type === 'text') {
                                obj.x = start.x;
                                obj.y = start.y;
                            } else if (obj.type === 'wall' || obj.type === 'dimension') {
                                obj.x1 = start.x1;
                                obj.y1 = start.y1;
                                obj.x2 = start.x2;
                                obj.y2 = start.y2;
                            }
                        }
                    });

                    const commands = moveInfos.map(info => 
                        new MoveObjectsCommand([info.id], info.dx, info.dy)
                    );

                    if (hasWalls && typeof WallConnection !== 'undefined') {
                        class MoveWallsWithConnectionsCommand extends Command {
                            constructor(moveCommands, oldConns) {
                                super();
                                this.moveCommands = moveCommands;
                                this.oldConnections = oldConns;
                                this.newConnections = null;
                            }
                            execute() {
                                this.moveCommands.forEach(cmd => cmd.execute());
                                if (typeof WallConnection !== 'undefined') {
                                    WallConnection.updateAllWallConnections();
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
                                for (let i = this.moveCommands.length - 1; i >= 0; i--) {
                                    this.moveCommands[i].undo();
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
                                this.moveCommands.forEach(cmd => cmd.redo ? cmd.redo() : cmd.execute());
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

                        CommandManager.execute(new MoveWallsWithConnectionsCommand(commands, oldWallConnections));
                    } else if (commands.length === 1) {
                        CommandManager.execute(commands[0]);
                    } else {
                        CommandManager.execute(new CompoundCommand(commands));
                    }
                }
            }
        } else if (Store.selection.handleType === 'resize') {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj && this.originalObject) {
                if (this.originalWidth !== obj.width || this.originalHeight !== obj.height ||
                    this.originalX !== obj.x || this.originalY !== obj.y) {
                    const gridSize = Store.canvas.gridSize;
                    
                    if (obj.type === 'group') {
                        this.finalizeGroupResize(obj);
                    } else {
                        const snappedWidth = Snap.snapToGrid(obj.width, gridSize);
                        const snappedHeight = Snap.snapToGrid(obj.height, gridSize);
                        const snappedX = Snap.snapToGrid(obj.x, gridSize);
                        const snappedY = Snap.snapToGrid(obj.y, gridSize);

                        obj.width = this.originalWidth;
                        obj.height = this.originalHeight;
                        obj.x = this.originalX;
                        obj.y = this.originalY;

                        CommandManager.execute(new ResizeObjectCommand(
                            obj.id,
                            this.originalWidth, this.originalHeight,
                            snappedWidth, snappedHeight,
                            this.originalX, this.originalY,
                            snappedX, snappedY
                        ));
                    }
                }
            }
        } else if (Store.selection.handleType === 'rotate') {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj && obj.type !== 'group') {
                if (this.originalRotation !== obj.rotation) {
                    const snappedRotation = Snap.snapAngle(obj.rotation);
                    obj.rotation = this.originalRotation;
                    CommandManager.execute(new RotateObjectCommand(
                        obj.id, this.originalRotation, snappedRotation
                    ));
                }
            }
        }

        Store.dragState.isDragging = false;
        Store.dragState.startObject = null;
        Store.dragState.startObjects = [];
        Store.selection.handleType = null;
        Store.selection.handleIndex = null;
        this.originalObject = null;
    },

    _getAllWallsState() {
        const state = {};
        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
        walls.forEach(wall => {
            state[wall.id] = {
                x1: wall.x1,
                y1: wall.y1,
                x2: wall.x2,
                y2: wall.y2,
                startConnection: wall.startConnection ? JSON.parse(JSON.stringify(wall.startConnection)) : undefined,
                endConnection: wall.endConnection ? JSON.parse(JSON.stringify(wall.endConnection)) : undefined
            };
        });
        return state;
    },

    _restoreWallsState(state) {
        Object.keys(state).forEach(wallId => {
            const wall = Store.getObject(wallId);
            if (wall) {
                const saved = state[wallId];
                wall.x1 = saved.x1;
                wall.y1 = saved.y1;
                wall.x2 = saved.x2;
                wall.y2 = saved.y2;
                if (saved.startConnection !== undefined) {
                    if (saved.startConnection) {
                        wall.startConnection = JSON.parse(JSON.stringify(saved.startConnection));
                    } else {
                        delete wall.startConnection;
                    }
                }
                if (saved.endConnection !== undefined) {
                    if (saved.endConnection) {
                        wall.endConnection = JSON.parse(JSON.stringify(saved.endConnection));
                    } else {
                        delete wall.endConnection;
                    }
                }
            }
        });
    },

    handleResize(obj, world) {
        if (obj.type === 'group') {
            this.handleGroupResize(obj, world);
        } else {
            this.handleObjectResize(obj, world);
        }
    },

    handleObjectResize(obj, world) {
        const handleIndex = Store.selection.handleIndex;
        const corners = Coordinates.getObjectCorners(this.originalObject);

        let oppositeIndex = (handleIndex + 4) % 8;
        let oppositeCorner;

        if (oppositeIndex % 2 === 1) {
            const cornerIdx = Math.floor((oppositeIndex + 1) / 2) % 4;
            oppositeCorner = corners[cornerIdx];
        } else {
            const edgeStart = Math.floor(oppositeIndex / 2);
            const edgeEnd = (edgeStart + 1) % 4;
            oppositeCorner = {
                x: (corners[edgeStart].x + corners[edgeEnd].x) / 2,
                y: (corners[edgeStart].y + corners[edgeEnd].y) / 2
            };
        }

        const cos = Math.cos(-this.originalRotation);
        const sin = Math.sin(-this.originalRotation);

        const localOpposite = {
            x: (oppositeCorner.x - this.originalX) * cos - (oppositeCorner.y - this.originalY) * sin,
            y: (oppositeCorner.x - this.originalX) * sin + (oppositeCorner.y - this.originalY) * cos
        };

        const localMouse = {
            x: (world.x - this.originalX) * cos - (world.y - this.originalY) * sin,
            y: (world.x - this.originalX) * sin + (world.y - this.originalY) * cos
        };

        let newWidth = Math.abs(localMouse.x - localOpposite.x);
        let newHeight = Math.abs(localMouse.y - localOpposite.y);
        let newLocalCenter = {
            x: (localMouse.x + localOpposite.x) / 2,
            y: (localMouse.y + localOpposite.y) / 2
        };

        if (handleIndex % 2 === 0) {
            if (handleIndex === 0 || handleIndex === 4) {
                newWidth = this.originalWidth;
                newLocalCenter.x = 0;
            } else {
                newHeight = this.originalHeight;
                newLocalCenter.y = 0;
            }
        }

        newWidth = Math.max(20, newWidth);
        newHeight = Math.max(20, newHeight);

        const cosBack = Math.cos(this.originalRotation);
        const sinBack = Math.sin(this.originalRotation);
        const newCenter = {
            x: this.originalX + newLocalCenter.x * cosBack - newLocalCenter.y * sinBack,
            y: this.originalY + newLocalCenter.x * sinBack + newLocalCenter.y * cosBack
        };

        obj.width = newWidth;
        obj.height = newHeight;
        obj.x = newCenter.x;
        obj.y = newCenter.y;
    },

    handleGroupResize(group, world) {
        const handleIndex = Store.selection.handleIndex;
        const corners = Coordinates.getObjectCorners(this.originalObject);

        let oppositeIndex = (handleIndex + 4) % 8;
        let oppositeCorner;

        if (oppositeIndex % 2 === 1) {
            const cornerIdx = Math.floor((oppositeIndex + 1) / 2) % 4;
            oppositeCorner = corners[cornerIdx];
        } else {
            const edgeStart = Math.floor(oppositeIndex / 2);
            const edgeEnd = (edgeStart + 1) % 4;
            oppositeCorner = {
                x: (corners[edgeStart].x + corners[edgeEnd].x) / 2,
                y: (corners[edgeStart].y + corners[edgeEnd].y) / 2
            };
        }

        const cos = Math.cos(-this.originalRotation);
        const sin = Math.sin(-this.originalRotation);

        const localOpposite = {
            x: (oppositeCorner.x - this.originalX) * cos - (oppositeCorner.y - this.originalY) * sin,
            y: (oppositeCorner.x - this.originalX) * sin + (oppositeCorner.y - this.originalY) * cos
        };

        const localMouse = {
            x: (world.x - this.originalX) * cos - (world.y - this.originalY) * sin,
            y: (world.x - this.originalX) * sin + (world.y - this.originalY) * cos
        };

        let scaleX = 1;
        let scaleY = 1;
        let localPivot = { x: 0, y: 0 };

        if (handleIndex % 2 === 0) {
            if (handleIndex === 0 || handleIndex === 4) {
                scaleX = 1;
                scaleY = Math.abs((localMouse.y - localOpposite.y) / this.originalHeight);
                localPivot.x = 0;
                localPivot.y = localOpposite.y;
            } else {
                scaleX = Math.abs((localMouse.x - localOpposite.x) / this.originalWidth);
                scaleY = 1;
                localPivot.x = localOpposite.x;
                localPivot.y = 0;
            }
        } else {
            scaleX = Math.abs((localMouse.x - localOpposite.x) / this.originalWidth);
            scaleY = Math.abs((localMouse.y - localOpposite.y) / this.originalHeight);
            localPivot.x = localOpposite.x;
            localPivot.y = localOpposite.y;
        }

        scaleX = Math.max(0.1, scaleX);
        scaleY = Math.max(0.1, scaleY);

        const cosBack = Math.cos(this.originalRotation);
        const sinBack = Math.sin(this.originalRotation);
        const worldPivot = {
            x: this.originalX + localPivot.x * cosBack - localPivot.y * sinBack,
            y: this.originalY + localPivot.x * sinBack + localPivot.y * cosBack
        };

        this.resetGroupToOriginal(group);
        Store.scaleGroup(group, scaleX, scaleY, worldPivot.x, worldPivot.y);
    },

    resetGroupToOriginal(group) {
        const original = this.originalObject;
        if (!original || !original.children) return;

        group.children = JSON.parse(JSON.stringify(original.children));
        Store.updateGroupBounds(group);
    },

    finalizeGroupResize(group) {
        const gridSize = Store.canvas.gridSize;
        
        const finalGroupData = JSON.parse(JSON.stringify(group));
        const originalGroupData = JSON.parse(JSON.stringify(this.originalObject));

        this.resetGroupToOriginal(group);

        class ResizeGroupCommand extends Command {
            constructor(groupId, originalData, finalData) {
                super();
                this.groupId = groupId;
                this.originalData = originalData;
                this.finalData = finalData;
            }
            execute() {
                const g = Store.getObject(this.groupId);
                if (g) {
                    g.children = JSON.parse(JSON.stringify(this.finalData.children));
                    Store.updateGroupBounds(g);
                }
            }
            undo() {
                const g = Store.getObject(this.groupId);
                if (g) {
                    g.children = JSON.parse(JSON.stringify(this.originalData.children));
                    Store.updateGroupBounds(g);
                }
            }
        }

        CommandManager.execute(new ResizeGroupCommand(
            group.id, originalGroupData, finalGroupData
        ));
    },

    handleRotate(obj, screenX, screenY) {
        const centerScreen = Coordinates.worldToScreen(obj.x, obj.y);
        const angle = Math.atan2(screenY - centerScreen.y, screenX - centerScreen.x) + Math.PI / 2;
        obj.rotation = angle;
    },

    handleDoubleClick(obj) {
        if (obj.type === 'group') {
            Store.enterGroup(obj.id);
        }
    },

    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (Store.selection.objectIds.length > 0) {
                const ids = [...Store.selection.objectIds];
                Store.clearSelection();
                ids.forEach(id => {
                    CommandManager.execute(new DeleteObjectCommand(id));
                });
            }
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'g' || e.key === 'G') {
                e.preventDefault();
                if (Store.selection.objectIds.length >= 2) {
                    CommandManager.execute(new CreateGroupCommand([...Store.selection.objectIds]));
                }
                return;
            }
            if (e.shiftKey && (e.key === 'g' || e.key === 'G')) {
                e.preventDefault();
                if (Store.selection.objectId) {
                    const obj = Store.getObject(Store.selection.objectId);
                    if (obj && obj.type === 'group') {
                        CommandManager.execute(new UngroupCommand(obj.id));
                    }
                }
                return;
            }
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                const objects = Store.getCurrentObjects();
                const ids = objects.map(o => o.id);
                Store.setSelection(ids);
                return;
            }
        }

        if (e.key === 'Escape') {
            if (Store.groupEditPath.length > 0) {
                Store.exitGroup();
            } else {
                Store.clearSelection();
                Store.previewObject = null;
                Store.dimensionStart = null;
                Store.dragState.isDragging = false;
            }
        }
    },

    handleContextMenu(e) {
        e.preventDefault();
        
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const hitObject = Collision.findObjectAtPoint(world.x, world.y);
        if (hitObject) {
            if (!Store.isSelected(hitObject.id)) {
                Store.selectObject(hitObject.id, hitObject.type);
            }
            this.contextMenuObjectId = hitObject.id;
            this.showContextMenu(e.clientX, e.clientY, hitObject);
        } else {
            this.hideContextMenu();
        }
    },

    showContextMenu(x, y, obj) {
        let menu = document.getElementById('context-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'context-menu';
            menu.className = 'context-menu';
            document.body.appendChild(menu);
        }

        let items = [];

        if (Store.selection.objectIds.length >= 2) {
            items.push({
                label: '创建组合 (Ctrl+G)',
                icon: '📦',
                action: () => {
                    CommandManager.execute(new CreateGroupCommand([...Store.selection.objectIds]));
                    this.hideContextMenu();
                }
            });
        }

        if (obj.type === 'group') {
            items.push({
                label: '编辑组合 (双击)',
                icon: '✏️',
                action: () => {
                    Store.enterGroup(obj.id);
                    this.hideContextMenu();
                }
            });
            items.push({
                label: '解散组合 (Ctrl+Shift+G)',
                icon: '🔓',
                action: () => {
                    CommandManager.execute(new UngroupCommand(obj.id));
                    this.hideContextMenu();
                }
            });
            items.push({ type: 'divider' });
            items.push({
                label: '保存到组件库',
                icon: '⭐',
                action: () => {
                    this.saveToComponentLibrary(obj);
                    this.hideContextMenu();
                }
            });
        }

        if (obj.type === 'furniture' || obj.type === 'text' || obj.type === 'doorWindow') {
            items.push({ type: 'divider' });
            items.push({
                label: '删除 (Delete)',
                icon: '🗑️',
                danger: true,
                action: () => {
                    CommandManager.execute(new DeleteObjectCommand(obj.id));
                    this.hideContextMenu();
                }
            });
        }

        if (items.length === 0) return;

        menu.innerHTML = '';
        items.forEach(item => {
            if (item.type === 'divider') {
                const divider = document.createElement('div');
                divider.className = 'context-menu-divider';
                menu.appendChild(divider);
            } else {
                const menuItem = document.createElement('div');
                menuItem.className = 'context-menu-item';
                if (item.danger) menuItem.classList.add('danger');
                menuItem.innerHTML = `
                    <span class="context-menu-icon">${item.icon}</span>
                    <span class="context-menu-label">${item.label}</span>
                `;
                menuItem.addEventListener('click', item.action);
                menu.appendChild(menuItem);
            }
        });

        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.display = 'block';

        setTimeout(() => {
            const menuRect = menu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
                menu.style.left = (x - menuRect.width) + 'px';
            }
            if (menuRect.bottom > window.innerHeight) {
                menu.style.top = (y - menuRect.height) + 'px';
            }
        }, 0);
    },

    hideContextMenu() {
        const menu = document.getElementById('context-menu');
        if (menu) {
            menu.style.display = 'none';
        }
        this.contextMenuObjectId = null;
    },

    saveToComponentLibrary(group) {
        const name = prompt('请输入组件名称:', '我的组件');
        if (!name) return;

        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        this.drawComponentThumbnail(canvas, group);

        const thumbnail = canvas.toDataURL('image/png');

        const component = {
            id: Store.generateId('component'),
            name: name,
            category: '常用',
            thumbnail: thumbnail,
            data: JSON.parse(JSON.stringify(group)),
            createdAt: Date.now()
        };

        CommandManager.execute(new SaveComponentCommand(component));
        if (window.ComponentLibrary) {
            window.ComponentLibrary.refresh();
        }
    },

    drawComponentThumbnail(canvas, group) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const padding = 10;

        ctx.clearRect(0, 0, size, size);

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const getBounds = (obj) => {
            if (obj.type === 'group' && obj.children) {
                obj.children.forEach(getBounds);
            } else if (obj.type === 'furniture') {
                const hw = obj.width / 2;
                const hh = obj.height / 2;
                const corners = [
                    { x: obj.x - hw, y: obj.y - hh },
                    { x: obj.x + hw, y: obj.y - hh },
                    { x: obj.x + hw, y: obj.y + hh },
                    { x: obj.x - hw, y: obj.y + hh }
                ];
                if (obj.rotation) {
                    const cx = obj.x, cy = obj.y;
                    const cos = Math.cos(obj.rotation);
                    const sin = Math.sin(obj.rotation);
                    corners.forEach(c => {
                        const x = cx + (c.x - cx) * cos - (c.y - cy) * sin;
                        const y = cy + (c.x - cx) * sin + (c.y - cy) * cos;
                        c.x = x;
                        c.y = y;
                    });
                }
                corners.forEach(c => {
                    minX = Math.min(minX, c.x);
                    minY = Math.min(minY, c.y);
                    maxX = Math.max(maxX, c.x);
                    maxY = Math.max(maxY, c.y);
                });
            }
        };

        if (group.children) {
            group.children.forEach(getBounds);
        }

        if (minX === Infinity) return;

        const boundsWidth = maxX - minX;
        const boundsHeight = maxY - minY;
        const scale = (size - padding * 2) / Math.max(boundsWidth, boundsHeight);
        const offsetX = (size - boundsWidth * scale) / 2 - minX * scale;
        const offsetY = (size - boundsHeight * scale) / 2 - minY * scale;

        const drawObj = (obj) => {
            if (obj.type === 'group' && obj.children) {
                obj.children.forEach(drawObj);
            } else if (obj.type === 'furniture') {
                ctx.save();
                ctx.translate(obj.x * scale + offsetX, obj.y * scale + offsetY);
                ctx.rotate(obj.rotation || 0);

                const w = obj.width * scale;
                const h = obj.height * scale;

                ctx.fillStyle = obj.color + 'cc';
                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.roundRect(-w / 2, -h / 2, w, h, 3);
                ctx.fill();
                ctx.stroke();

                ctx.restore();
            }
        };

        if (group.children) {
            group.children.forEach(drawObj);
        }
    }
};
