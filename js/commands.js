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
    }
    execute() {
        this.object = Store.getObject(this.objectId);
        Store.removeObject(this.objectId);
        Store.clearSelection();
    }
    undo() {
        Store.addObject(this.object);
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
