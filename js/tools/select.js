const SelectTool = {
    lastMoveX: 0,
    lastMoveY: 0,
    originalObject: null,
    originalRotation: 0,
    originalWidth: 0,
    originalHeight: 0,
    originalX: 0,
    originalY: 0,

    handleMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        if (Store.selection.objectId) {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj && (obj.type === 'furniture' || obj.type === 'text')) {
                const handle = Collision.hitTestHandle(screenX, screenY, obj);
                if (handle) {
                    Store.selection.handleType = handle.type;
                    Store.selection.handleIndex = handle.index;
                    Store.dragState.isDragging = true;
                    Store.dragState.startX = world.x;
                    Store.dragState.startY = world.y;
                    this.lastMoveX = world.x;
                    this.lastMoveY = world.y;
                    this.originalObject = JSON.parse(JSON.stringify(obj));
                    this.originalRotation = obj.rotation || 0;
                    this.originalWidth = obj.width;
                    this.originalHeight = obj.height;
                    this.originalX = obj.x;
                    this.originalY = obj.y;
                    return;
                }
            }
        }

        const hitObject = Collision.findObjectAtPoint(world.x, world.y);
        if (hitObject) {
            Store.selectObject(hitObject.id, hitObject.type);
            Store.dragState.isDragging = true;
            Store.dragState.startX = world.x;
            Store.dragState.startY = world.y;
            Store.dragState.startObject = JSON.parse(JSON.stringify(hitObject));
            this.lastMoveX = world.x;
            this.lastMoveY = world.y;
            this.originalObject = JSON.parse(JSON.stringify(hitObject));
            Store.selection.handleType = 'move';
        } else {
            Store.clearSelection();
        }
    },

    handleMouseMove(e) {
        if (!Store.dragState.isDragging) return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const obj = Store.getObject(Store.selection.objectId);
        if (!obj) return;

        if (Store.selection.handleType === 'move') {
            const dx = world.x - this.lastMoveX;
            const dy = world.y - this.lastMoveY;
            Store.moveObject(obj.id, dx, dy);
            this.lastMoveX = world.x;
            this.lastMoveY = world.y;
        } else if (Store.selection.handleType === 'resize') {
            this.handleResize(obj, world);
        } else if (Store.selection.handleType === 'rotate') {
            this.handleRotate(obj, screenX, screenY);
        }
    },

    handleMouseUp(e) {
        if (!Store.dragState.isDragging) return;

        const obj = Store.getObject(Store.selection.objectId);
        if (obj && this.originalObject) {
            if (Store.selection.handleType === 'move') {
                const currentX = obj.x;
                const currentY = obj.y;

                if (obj.type === 'furniture') {
                    const gridSize = Store.canvas.gridSize;
                    obj.x = Snap.snapToGrid(obj.x, gridSize);
                    obj.y = Snap.snapToGrid(obj.y, gridSize);
                }

                const totalDx = obj.x - this.originalObject.x;
                const totalDy = obj.y - this.originalObject.y;

                if (Math.abs(totalDx) > 0.1 || Math.abs(totalDy) > 0.1) {
                    obj.x = this.originalObject.x;
                    obj.y = this.originalObject.y;
                    CommandManager.execute(new MoveObjectCommand(obj.id, totalDx, totalDy));
                }
            } else if (Store.selection.handleType === 'resize') {
                if (this.originalWidth !== obj.width || this.originalHeight !== obj.height ||
                    this.originalX !== obj.x || this.originalY !== obj.y) {
                    const gridSize = Store.canvas.gridSize;
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
            } else if (Store.selection.handleType === 'rotate') {
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
        Store.selection.handleType = null;
        Store.selection.handleIndex = null;
        this.originalObject = null;
    },

    handleResize(obj, world) {
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

    handleRotate(obj, screenX, screenY) {
        const centerScreen = Coordinates.worldToScreen(obj.x, obj.y);
        const angle = Math.atan2(screenY - centerScreen.y, screenX - centerScreen.x) + Math.PI / 2;
        obj.rotation = angle;
    },

    handleKeyDown(e) {
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (Store.selection.objectId) {
                CommandManager.execute(new DeleteObjectCommand(Store.selection.objectId));
            }
        }
    }
};
