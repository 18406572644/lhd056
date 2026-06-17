class Command {
    execute() {}
    undo() {}
}

class CreateObjectCommand extends Command {
    constructor(object) {
        super();
        this.object = object;
    }
    execute() {
        Store.addObject(this.object);
    }
    undo() {
        Store.removeObject(this.object.id);
    }
}

class DeleteObjectCommand extends Command {
    constructor(objectId) {
        super();
        this.objectId = objectId;
        this.object = null;
        this.parentGroupId = null;
        this.connectedWallsState = null;
    }
    execute() {
        const obj = Store.getObject(this.objectId);
        if (obj) {
            this.object = JSON.parse(JSON.stringify(obj));
        }
        const parent = Store.getObjectParent(this.objectId);
        this.parentGroupId = parent ? parent.id : null;

        if (obj && obj.type === 'wall' && typeof WallConnection !== 'undefined') {
            this.connectedWallsState = {};
            const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
            walls.forEach(w => {
                if (w.id !== this.objectId) {
                    const hasConnection = 
                        (w.startConnection && w.startConnection.wallId === this.objectId) ||
                        (w.endConnection && w.endConnection.wallId === this.objectId);
                    if (hasConnection) {
                        this.connectedWallsState[w.id] = {
                            startConnection: w.startConnection ? JSON.parse(JSON.stringify(w.startConnection)) : null,
                            endConnection: w.endConnection ? JSON.parse(JSON.stringify(w.endConnection)) : null
                        };
                    }
                }
            });

            WallConnection.handleWallDeletion(this.objectId);
        }

        Store.removeObject(this.objectId);
        Store.clearSelection();
    }
    undo() {
        if (!this.object) return;
        const objClone = JSON.parse(JSON.stringify(this.object));
        if (this.parentGroupId) {
            const parent = Store.getObject(this.parentGroupId);
            if (parent) {
                parent.children.push(objClone);
            } else {
                Store.objects.push(objClone);
            }
        } else {
            Store.objects.push(objClone);
        }

        if (this.connectedWallsState) {
            Object.keys(this.connectedWallsState).forEach(wallId => {
                const wall = Store.getObject(wallId);
                if (wall) {
                    const state = this.connectedWallsState[wallId];
                    if (state.startConnection !== undefined) {
                        if (state.startConnection) {
                            wall.startConnection = JSON.parse(JSON.stringify(state.startConnection));
                        } else {
                            delete wall.startConnection;
                        }
                    }
                    if (state.endConnection !== undefined) {
                        if (state.endConnection) {
                            wall.endConnection = JSON.parse(JSON.stringify(state.endConnection));
                        } else {
                            delete wall.endConnection;
                        }
                    }
                }
            });
        }
    }
}

class MoveObjectCommand extends Command {
    constructor(objectId, dx, dy) {
        super();
        this.objectId = objectId;
        this.dx = dx;
        this.dy = dy;
    }
    execute() {
        Store.moveObject(this.objectId, this.dx, this.dy);
    }
    undo() {
        Store.moveObject(this.objectId, -this.dx, -this.dy);
    }
}

class ResizeObjectCommand extends Command {
    constructor(objectId, oldWidth, oldHeight, newWidth, newHeight, oldX, oldY, newX, newY) {
        super();
        this.objectId = objectId;
        this.oldWidth = oldWidth;
        this.oldHeight = oldHeight;
        this.newWidth = newWidth;
        this.newHeight = newHeight;
        this.oldX = oldX;
        this.oldY = oldY;
        this.newX = newX;
        this.newY = newY;
    }
    execute() {
        Store.updateObject(this.objectId, {
            width: this.newWidth,
            height: this.newHeight,
            x: this.newX,
            y: this.newY
        });
    }
    undo() {
        Store.updateObject(this.objectId, {
            width: this.oldWidth,
            height: this.oldHeight,
            x: this.oldX,
            y: this.oldY
        });
    }
}

class RotateObjectCommand extends Command {
    constructor(objectId, oldRotation, newRotation) {
        super();
        this.objectId = objectId;
        this.oldRotation = oldRotation;
        this.newRotation = newRotation;
    }
    execute() {
        Store.updateObject(this.objectId, { rotation: this.newRotation });
    }
    undo() {
        Store.updateObject(this.objectId, { rotation: this.oldRotation });
    }
}

class ChangeColorCommand extends Command {
    constructor(objectId, oldColor, newColor) {
        super();
        this.objectId = objectId;
        this.oldColor = oldColor;
        this.newColor = newColor;
    }
    execute() {
        Store.updateObject(this.objectId, { color: this.newColor });
    }
    undo() {
        Store.updateObject(this.objectId, { color: this.oldColor });
    }
}

class BatchChangeColorCommand extends Command {
    constructor(objectIds, oldColors, newColor) {
        super();
        this.objectIds = objectIds;
        this.oldColors = oldColors;
        this.newColor = newColor;
    }
    execute() {
        this.objectIds.forEach(id => {
            Store.updateObject(id, { color: this.newColor });
        });
    }
    undo() {
        this.objectIds.forEach((id, index) => {
            Store.updateObject(id, { color: this.oldColors[index] });
        });
    }
}

class CompoundCommand extends Command {
    constructor(commands) {
        super();
        this.commands = commands;
    }
    execute() {
        this.commands.forEach(cmd => cmd.execute());
    }
    undo() {
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}

class CreateGroupCommand extends Command {
    constructor(objectIds) {
        super();
        this.objectIds = objectIds;
        this.group = null;
        this.parentGroupId = null;
        this.originalPositions = [];
    }

    execute() {
        const objects = this.objectIds.map(id => Store.getObject(id)).filter(Boolean);
        if (objects.length < 2) return;

        const group = {
            id: Store.generateId('group'),
            type: 'group',
            children: [],
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            rotation: 0,
            createdAt: Date.now()
        };

        const parent = Store.getObjectParent(objects[0].id);
        this.parentGroupId = parent ? parent.id : null;

        objects.forEach(obj => {
            this.originalPositions.push({ id: obj.id, parentId: this.parentGroupId });
            Store.removeObject(obj.id);
            group.children.push(obj);
        });

        Store.updateGroupBounds(group);
        this.group = group;

        if (parent) {
            parent.children.push(group);
        } else {
            Store.objects.push(group);
        }

        Store.selectObject(group.id, 'group');
    }

    undo() {
        if (!this.group) return;

        const parent = this.parentGroupId ? Store.getObject(this.parentGroupId) : null;

        if (parent) {
            const idx = parent.children.findIndex(c => c.id === this.group.id);
            if (idx !== -1) parent.children.splice(idx, 1);
        } else {
            const idx = Store.objects.findIndex(o => o.id === this.group.id);
            if (idx !== -1) Store.objects.splice(idx, 1);
        }

        this.group.children.forEach(child => {
            if (parent) {
                parent.children.push(child);
            } else {
                Store.objects.push(child);
            }
        });

        Store.clearSelection();
    }
}

class UngroupCommand extends Command {
    constructor(groupId) {
        super();
        this.groupId = groupId;
        this.group = null;
        this.parentGroupId = null;
    }

    execute() {
        const group = Store.getObject(this.groupId);
        if (!group || group.type !== 'group') return;

        this.group = JSON.parse(JSON.stringify(group));
        const parent = Store.getObjectParent(this.groupId);
        this.parentGroupId = parent ? parent.id : null;

        const children = [...group.children];

        if (parent) {
            const idx = parent.children.findIndex(c => c.id === this.groupId);
            if (idx !== -1) parent.children.splice(idx, 1);
            children.forEach(child => parent.children.push(child));
        } else {
            const idx = Store.objects.findIndex(o => o.id === this.groupId);
            if (idx !== -1) Store.objects.splice(idx, 1);
            children.forEach(child => Store.objects.push(child));
        }

        Store.clearSelection();
    }

    undo() {
        if (!this.group) return;

        const groupCopy = JSON.parse(JSON.stringify(this.group));
        const parent = this.parentGroupId ? Store.getObject(this.parentGroupId) : null;

        groupCopy.children.forEach(child => {
            Store.removeObject(child.id);
        });

        if (parent) {
            parent.children.push(groupCopy);
        } else {
            Store.objects.push(groupCopy);
        }

        Store.selectObject(groupCopy.id, 'group');
    }
}

class MoveObjectsCommand extends Command {
    constructor(objectIds, dx, dy) {
        super();
        this.objectIds = objectIds;
        this.dx = dx;
        this.dy = dy;
    }

    execute() {
        this.objectIds.forEach(id => {
            Store.moveObject(id, this.dx, this.dy);
        });
    }

    undo() {
        this.objectIds.forEach(id => {
            Store.moveObject(id, -this.dx, -this.dy);
        });
    }
}

class SaveComponentCommand extends Command {
    constructor(component) {
        super();
        this.component = component;
    }

    execute() {
        Store.addComponent(this.component);
    }

    undo() {
        Store.removeComponent(this.component.id);
    }
}

class DeleteComponentCommand extends Command {
    constructor(componentId) {
        super();
        this.componentId = componentId;
        this.component = null;
    }

    execute() {
        this.component = Store.componentLibrary.components.find(c => c.id === this.componentId);
        Store.removeComponent(this.componentId);
    }

    undo() {
        if (this.component) {
            Store.addComponent(this.component);
        }
    }
}

class ModifyWallEndpointCommand extends Command {
    constructor(wallId, endpoint, oldX, oldY, newX, newY) {
        super();
        this.wallId = wallId;
        this.endpoint = endpoint;
        this.oldX = oldX;
        this.oldY = oldY;
        this.newX = newX;
        this.newY = newY;
        this.oldWallData = null;
        this.newWallData = null;
        this.affectedWalls = [];
    }

    execute() {
        if (this.newWallData) {
            this._restoreWallData(this.newWallData);
        } else {
            if (typeof WallConnection !== 'undefined') {
                WallConnection.moveWallEndpoint(this.wallId, this.endpoint, this.newX, this.newY, true);
            } else {
                const wall = Store.getObject(this.wallId);
                if (wall) {
                    if (this.endpoint === 'start') {
                        wall.x1 = this.newX;
                        wall.y1 = this.newY;
                    } else {
                        wall.x2 = this.newX;
                        wall.y2 = this.newY;
                    }
                }
            }
        }
    }

    undo() {
        if (this.oldWallData) {
            this._restoreWallData(this.oldWallData);
        } else {
            if (typeof WallConnection !== 'undefined') {
                WallConnection.moveWallEndpoint(this.wallId, this.endpoint, this.oldX, this.oldY, false);
            } else {
                const wall = Store.getObject(this.wallId);
                if (wall) {
                    if (this.endpoint === 'start') {
                        wall.x1 = this.oldX;
                        wall.y1 = this.oldY;
                    } else {
                        wall.x2 = this.oldX;
                        wall.y2 = this.oldY;
                    }
                }
            }
        }
    }

    setAffectedWalls(wallDataMap) {
        this.oldWallData = {};
        this.newWallData = {};
        const walls = Store.getCurrentObjects().filter(o => o.type === 'wall');
        walls.forEach(w => {
            this.oldWallData[w.id] = JSON.parse(JSON.stringify(w));
        });
        this.newWallData = wallDataMap;
    }

    _restoreWallData(data) {
        Object.keys(data).forEach(wallId => {
            const wall = Store.getObject(wallId);
            if (wall) {
                const saved = data[wallId];
                Object.keys(saved).forEach(key => {
                    wall[key] = saved[key];
                });
            }
        });
    }
}

class BatchModifyWallsCommand extends Command {
    constructor(oldStates, newStates) {
        super();
        this.oldStates = oldStates;
        this.newStates = newStates;
    }

    execute() {
        this._applyStates(this.newStates);
    }

    undo() {
        this._applyStates(this.oldStates);
    }

    _applyStates(states) {
        states.forEach(state => {
            const wall = Store.getObject(state.id);
            if (wall) {
                if (state.x1 !== undefined) wall.x1 = state.x1;
                if (state.y1 !== undefined) wall.y1 = state.y1;
                if (state.x2 !== undefined) wall.x2 = state.x2;
                if (state.y2 !== undefined) wall.y2 = state.y2;
                if (state.startConnection !== undefined) {
                    if (state.startConnection) {
                        wall.startConnection = state.startConnection;
                    } else {
                        delete wall.startConnection;
                    }
                }
                if (state.endConnection !== undefined) {
                    if (state.endConnection) {
                        wall.endConnection = state.endConnection;
                    } else {
                        delete wall.endConnection;
                    }
                }
            }
        });
    }
}

const CommandManager = {
    undoStack: [],
    redoStack: [],
    maxHistory: 30,

    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = [];
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
    },

    undo() {
        if (this.undoStack.length === 0) return;
        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);
    },

    redo() {
        if (this.redoStack.length === 0) return;
        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);
    },

    canUndo() {
        return this.undoStack.length > 0;
    },

    canRedo() {
        return this.redoStack.length > 0;
    }
};
