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
    }
    execute() {
        this.object = Store.getObject(this.objectId);
        if (this.object) {
            this.object = JSON.parse(JSON.stringify(this.object));
        }
        const parent = Store.getObjectParent(this.objectId);
        this.parentGroupId = parent ? parent.id : null;
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
