const Store = {
    canvas: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 2,
        offsetX: 0,
        offsetY: 0,
        gridSize: 10
    },

    currentTool: 'select',

    selection: {
        objectId: null,
        type: null,
        handleType: null,
        handleIndex: null
    },

    dragState: {
        isDragging: false,
        startX: 0,
        startY: 0,
        startObject: null,
        tempObject: null
    },

    panState: {
        isPanning: false,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0
    },

    objects: [],

    previewObject: null,

    dimensionStart: null,

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addObject(object) {
        this.objects.push(object);
    },

    removeObject(objectId) {
        const index = this.objects.findIndex(o => o.id === objectId);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
    },

    getObject(objectId) {
        return this.objects.find(o => o.id === objectId);
    },

    updateObject(objectId, updates) {
        const obj = this.getObject(objectId);
        if (obj) {
            Object.assign(obj, updates);
        }
    },

    moveObject(objectId, dx, dy) {
        const obj = this.getObject(objectId);
        if (obj) {
            if (obj.type === 'furniture' || obj.type === 'text') {
                obj.x += dx;
                obj.y += dy;
            } else if (obj.type === 'wall') {
                obj.x1 += dx;
                obj.y1 += dy;
                obj.x2 += dx;
                obj.y2 += dy;
            } else if (obj.type === 'dimension') {
                obj.x1 += dx;
                obj.y1 += dy;
                obj.x2 += dx;
                obj.y2 += dy;
            }
        }
    },

    clearSelection() {
        this.selection.objectId = null;
        this.selection.type = null;
        this.selection.handleType = null;
        this.selection.handleIndex = null;
    },

    selectObject(objectId, type) {
        this.selection.objectId = objectId;
        this.selection.type = type;
    },

    setTool(tool) {
        this.currentTool = tool;
        this.previewObject = null;
        this.dimensionStart = null;
    },

    setScale(scale) {
        this.canvas.scale = Math.max(0.25, Math.min(4, scale));
    },

    setOffset(x, y) {
        this.canvas.offsetX = x;
        this.canvas.offsetY = y;
    }
};
