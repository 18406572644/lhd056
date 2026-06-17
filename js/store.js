const Store = {
    canvas: {
        width: window.innerWidth,
        height: window.innerHeight,
        scale: 2,
        offsetX: 0,
        offsetY: 0,
        gridSize: 10
    },

    is3DMode: false,

    camera3D: {
        angleX: -0.5,
        angleY: Math.PI / 4,
        distance: 800,
        targetX: 0,
        targetY: 100,
        targetZ: 0
    },

    defaultWallHeight: 280,

    currentTool: 'select',

    selection: {
        objectIds: [],
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
        tempObject: null,
        startObjects: []
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

    groupEditPath: [],

    componentLibrary: {
        categories: ['常用', '客厅', '卧室', '厨房', '卫浴'],
        components: []
    },

    templateLibrary: {
        privateTemplates: []
    },

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.loadComponentLibrary();
        this.loadTemplateLibrary();
    },

    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    addObject(object) {
        if (this.groupEditPath.length > 0) {
            const parentGroup = this.getCurrentGroup();
            if (parentGroup) {
                parentGroup.children.push(object);
                return;
            }
        }
        this.objects.push(object);
        if (typeof Renderer3D !== 'undefined' && this.is3DMode) {
            Renderer3D.markForUpdate();
        }
    },

    removeObject(objectId) {
        if (this.groupEditPath.length > 0) {
            const parentGroup = this.getCurrentGroup();
            if (parentGroup) {
                const index = parentGroup.children.findIndex(o => o.id === objectId);
                if (index !== -1) {
                    parentGroup.children.splice(index, 1);
                }
                return;
            }
        }
        const index = this.objects.findIndex(o => o.id === objectId);
        if (index !== -1) {
            this.objects.splice(index, 1);
        }
        if (typeof Renderer3D !== 'undefined' && this.is3DMode) {
            Renderer3D.markForUpdate();
        }
    },

    getObject(objectId) {
        const findInList = (list) => {
            for (const obj of list) {
                if (obj.id === objectId) return obj;
                if (obj.type === 'group' && obj.children) {
                    const found = findInList(obj.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findInList(this.objects);
    },

    getObjectParent(objectId) {
        const findParent = (list, parent = null) => {
            for (const obj of list) {
                if (obj.id === objectId) return parent;
                if (obj.type === 'group' && obj.children) {
                    const found = findParent(obj.children, obj);
                    if (found !== undefined) return found;
                }
            }
            return undefined;
        };
        return findParent(this.objects);
    },

    updateObject(objectId, updates) {
        const obj = this.getObject(objectId);
        if (obj) {
            Object.assign(obj, updates);
            if (typeof Renderer3D !== 'undefined' && this.is3DMode) {
                Renderer3D.markForUpdate();
            }
        }
    },

    moveObject(objectId, dx, dy) {
        const obj = this.getObject(objectId);
        if (obj) {
            if (obj.type === 'group') {
                this.moveGroup(obj, dx, dy);
            } else if (obj.type === 'furniture' || obj.type === 'text') {
                obj.x += dx;
                obj.y += dy;
            } else if (obj.type === 'wall') {
                obj.x1 += dx;
                obj.y1 += dy;
                obj.x2 += dx;
                obj.y2 += dy;
                this.updateAttachedDoorWindows(obj);
            } else if (obj.type === 'doorWindow') {
                obj.x += dx;
                obj.y += dy;
            } else if (obj.type === 'dimension') {
                obj.x1 += dx;
                obj.y1 += dy;
                obj.x2 += dx;
                obj.y2 += dy;
            }
            if (typeof Renderer3D !== 'undefined' && this.is3DMode) {
                Renderer3D.markForUpdate();
            }
        }
    },

    updateAttachedDoorWindows(wall) {
        const objects = this.getCurrentObjects();
        objects.forEach(obj => {
            if (obj.type === 'doorWindow' && obj.wallId === wall.id) {
                if (typeof DoorWindowTool !== 'undefined') {
                    DoorWindowTool.updateDoorWindowPosition(obj);
                }
            }
        });
    },

    moveGroup(group, dx, dy) {
        if (group.children) {
            group.children.forEach(child => {
                if (child.type === 'group') {
                    this.moveGroup(child, dx, dy);
                } else if (child.type === 'furniture' || child.type === 'text' || child.type === 'doorWindow') {
                    child.x += dx;
                    child.y += dy;
                } else if (child.type === 'wall') {
                    child.x1 += dx;
                    child.y1 += dy;
                    child.x2 += dx;
                    child.y2 += dy;
                } else if (child.type === 'dimension') {
                    child.x1 += dx;
                    child.y1 += dy;
                    child.x2 += dx;
                    child.y2 += dy;
                }
            });
        }
        this.updateGroupBounds(group);
    },

    scaleGroup(group, scaleX, scaleY, centerX, centerY) {
        if (!group.children) return;

        const scaleChild = (child) => {
            if (child.type === 'group') {
                if (child.children) {
                    child.children.forEach(scaleChild);
                }
                this.updateGroupBounds(child);
            } else if (child.type === 'furniture' || child.type === 'text') {
                const dx = child.x - centerX;
                const dy = child.y - centerY;
                child.x = centerX + dx * scaleX;
                child.y = centerY + dy * scaleY;
                child.width *= scaleX;
                child.height *= scaleY;
            } else if (child.type === 'wall' || child.type === 'dimension') {
                const dx1 = child.x1 - centerX;
                const dy1 = child.y1 - centerY;
                const dx2 = child.x2 - centerX;
                const dy2 = child.y2 - centerY;
                child.x1 = centerX + dx1 * scaleX;
                child.y1 = centerY + dy1 * scaleY;
                child.x2 = centerX + dx2 * scaleX;
                child.y2 = centerY + dy2 * scaleY;
            }
        };

        group.children.forEach(scaleChild);
        this.updateGroupBounds(group);
    },

    rotateGroup(group, angle, centerX, centerY) {
        if (!group.children) return;

        const cos = Math.cos(angle);
        const sin = Math.sin(angle);

        const rotateChild = (child) => {
            if (child.type === 'group') {
                if (child.children) {
                    child.children.forEach(rotateChild);
                }
                this.updateGroupBounds(child);
            } else if (child.type === 'furniture' || child.type === 'text') {
                const dx = child.x - centerX;
                const dy = child.y - centerY;
                child.x = centerX + dx * cos - dy * sin;
                child.y = centerY + dx * sin + dy * cos;
                child.rotation = (child.rotation || 0) + angle;
            } else if (child.type === 'wall' || child.type === 'dimension') {
                const dx1 = child.x1 - centerX;
                const dy1 = child.y1 - centerY;
                const dx2 = child.x2 - centerX;
                const dy2 = child.y2 - centerY;
                child.x1 = centerX + dx1 * cos - dy1 * sin;
                child.y1 = centerY + dx1 * sin + dy1 * cos;
                child.x2 = centerX + dx2 * cos - dy2 * sin;
                child.y2 = centerY + dx2 * sin + dy2 * cos;
            }
        };

        group.children.forEach(rotateChild);
        this.updateGroupBounds(group);
    },

    clearSelection() {
        this.selection.objectIds = [];
        this.selection.objectId = null;
        this.selection.type = null;
        this.selection.handleType = null;
        this.selection.handleIndex = null;
    },

    selectObject(objectId, type) {
        this.selection.objectIds = [objectId];
        this.selection.objectId = objectId;
        this.selection.type = type;
    },

    toggleSelection(objectId, type) {
        const index = this.selection.objectIds.indexOf(objectId);
        if (index === -1) {
            this.selection.objectIds.push(objectId);
        } else {
            this.selection.objectIds.splice(index, 1);
        }
        if (this.selection.objectIds.length > 0) {
            this.selection.objectId = this.selection.objectIds[this.selection.objectIds.length - 1];
            this.selection.type = type;
        } else {
            this.selection.objectId = null;
            this.selection.type = null;
        }
    },

    setSelection(objectIds) {
        this.selection.objectIds = [...objectIds];
        if (objectIds.length > 0) {
            this.selection.objectId = objectIds[objectIds.length - 1];
            const obj = this.getObject(objectIds[objectIds.length - 1]);
            this.selection.type = obj ? obj.type : null;
        } else {
            this.selection.objectId = null;
            this.selection.type = null;
        }
    },

    isSelected(objectId) {
        return this.selection.objectIds.includes(objectId);
    },

    setTool(tool) {
        this.currentTool = tool;
        this.previewObject = null;
        this.dimensionStart = null;
    },

    toggle3DMode() {
        this.is3DMode = !this.is3DMode;
        if (typeof Renderer3D !== 'undefined') {
            Renderer3D.markForUpdate();
        }
    },

    set3DMode(enabled) {
        this.is3DMode = enabled;
        if (typeof Renderer3D !== 'undefined') {
            Renderer3D.markForUpdate();
        }
    },

    setCamera3D(camera) {
        Object.assign(this.camera3D, camera);
    },

    setScale(scale) {
        this.canvas.scale = Math.max(0.25, Math.min(4, scale));
    },

    setOffset(x, y) {
        this.canvas.offsetX = x;
        this.canvas.offsetY = y;
    },

    getGroupBounds(group) {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const processObject = (obj) => {
            if (obj.type === 'group') {
                if (obj.children) {
                    obj.children.forEach(processObject);
                }
            } else if (obj.type === 'furniture' || obj.type === 'text') {
                const corners = Coordinates.getObjectCorners(obj);
                corners.forEach(c => {
                    minX = Math.min(minX, c.x);
                    minY = Math.min(minY, c.y);
                    maxX = Math.max(maxX, c.x);
                    maxY = Math.max(maxY, c.y);
                });
            } else if (obj.type === 'wall') {
                minX = Math.min(minX, obj.x1, obj.x2);
                minY = Math.min(minY, obj.y1, obj.y2);
                maxX = Math.max(maxX, obj.x1, obj.x2);
                maxY = Math.max(maxY, obj.y1, obj.y2);
            } else if (obj.type === 'dimension') {
                minX = Math.min(minX, obj.x1, obj.x2);
                minY = Math.min(minY, obj.y1, obj.y2);
                maxX = Math.max(maxX, obj.x1, obj.x2);
                maxY = Math.max(maxY, obj.y1, obj.y2);
            }
        };

        if (group.children) {
            group.children.forEach(processObject);
        }

        if (minX === Infinity) return null;

        return {
            x: (minX + maxX) / 2,
            y: (minY + maxY) / 2,
            width: maxX - minX,
            height: maxY - minY,
            minX, minY, maxX, maxY
        };
    },

    updateGroupBounds(group) {
        const bounds = this.getGroupBounds(group);
        if (bounds) {
            group.x = bounds.x;
            group.y = bounds.y;
            group.width = bounds.width;
            group.height = bounds.height;
        }
    },

    getCurrentObjects() {
        if (this.groupEditPath.length === 0) {
            return this.objects;
        }
        const currentGroup = this.getCurrentGroup();
        return currentGroup ? currentGroup.children : this.objects;
    },

    getCurrentGroup() {
        if (this.groupEditPath.length === 0) return null;
        let current = null;
        let list = this.objects;
        for (const groupId of this.groupEditPath) {
            current = list.find(o => o.id === groupId);
            if (current && current.children) {
                list = current.children;
            } else {
                return null;
            }
        }
        return current;
    },

    enterGroup(groupId) {
        this.groupEditPath.push(groupId);
        this.clearSelection();
    },

    exitGroup() {
        if (this.groupEditPath.length > 0) {
            this.groupEditPath.pop();
            this.clearSelection();
        }
    },

    exitAllGroups() {
        this.groupEditPath = [];
        this.clearSelection();
    },

    loadComponentLibrary() {
        try {
            const saved = localStorage.getItem('floorplan_component_library');
            if (saved) {
                const data = JSON.parse(saved);
                this.componentLibrary.components = data.components || [];
                if (data.categories) {
                    this.componentLibrary.categories = data.categories;
                }
            }
        } catch (e) {
            console.error('加载组件库失败:', e);
        }
    },

    saveComponentLibrary() {
        try {
            localStorage.setItem('floorplan_component_library', JSON.stringify({
                categories: this.componentLibrary.categories,
                components: this.componentLibrary.components
            }));
        } catch (e) {
            console.error('保存组件库失败:', e);
        }
    },

    addComponent(component) {
        this.componentLibrary.components.push(component);
        this.saveComponentLibrary();
    },

    removeComponent(componentId) {
        const index = this.componentLibrary.components.findIndex(c => c.id === componentId);
        if (index !== -1) {
            this.componentLibrary.components.splice(index, 1);
            this.saveComponentLibrary();
        }
    },

    updateComponent(componentId, updates) {
        const comp = this.componentLibrary.components.find(c => c.id === componentId);
        if (comp) {
            Object.assign(comp, updates);
            this.saveComponentLibrary();
        }
    },

    loadTemplateLibrary() {
        try {
            const saved = localStorage.getItem('floorplan_template_library');
            if (saved) {
                const data = JSON.parse(saved);
                this.templateLibrary.privateTemplates = data.privateTemplates || [];
            }
        } catch (e) {
            console.error('加载模板库失败:', e);
        }
    },

    saveTemplateLibrary() {
        try {
            localStorage.setItem('floorplan_template_library', JSON.stringify({
                privateTemplates: this.templateLibrary.privateTemplates
            }));
        } catch (e) {
            console.error('保存模板库失败:', e);
        }
    },

    addTemplate(template) {
        this.templateLibrary.privateTemplates.push(template);
        this.saveTemplateLibrary();
    },

    removeTemplate(templateId) {
        const index = this.templateLibrary.privateTemplates.findIndex(t => t.id === templateId);
        if (index !== -1) {
            this.templateLibrary.privateTemplates.splice(index, 1);
            this.saveTemplateLibrary();
        }
    },

    updateTemplate(templateId, updates) {
        const template = this.templateLibrary.privateTemplates.find(t => t.id === templateId);
        if (template) {
            Object.assign(template, updates);
            this.saveTemplateLibrary();
        }
    },

    loadTemplateToCanvas(template) {
        this.objects = [];
        this.clearSelection();
        this.groupEditPath = [];

        const objects = JSON.parse(JSON.stringify(template.objects));
        this._regenerateTemplateIds(objects);
        this.objects = objects;

        if (typeof WallConnection !== 'undefined') {
            WallConnection.updateAllWallConnections();
        }
    },

    _regenerateTemplateIds(objects) {
        const idMap = {};

        objects.forEach(obj => {
            const oldId = obj.id;
            const newId = this.generateId(obj.type || 'obj');
            idMap[oldId] = newId;
            obj.id = newId;
        });

        return idMap;
    },

    saveCurrentAsTemplate(name, category, description) {
        const objects = JSON.parse(JSON.stringify(this.objects));

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const getBounds = (obj) => {
            if (obj.type === 'wall') {
                minX = Math.min(minX, obj.x1, obj.x2);
                minY = Math.min(minY, obj.y1, obj.y2);
                maxX = Math.max(maxX, obj.x1, obj.x2);
                maxY = Math.max(maxY, obj.y1, obj.y2);
            } else if (obj.type === 'furniture' || obj.type === 'text') {
                const hw = obj.width / 2;
                const hh = obj.height / 2;
                minX = Math.min(minX, obj.x - hw);
                minY = Math.min(minY, obj.y - hh);
                maxX = Math.max(maxX, obj.x + hw);
                maxY = Math.max(maxY, obj.y + hh);
            } else if (obj.type === 'group' && obj.children) {
                obj.children.forEach(getBounds);
            }
        };

        objects.forEach(getBounds);

        const area = Math.round(((maxX - minX) / 100) * ((maxY - minY) / 100));
        const roomCount = objects.filter(o => o.type === 'wall').length;

        const template = {
            id: this.generateId('template'),
            name: name,
            category: category,
            area: area,
            roomCount: Math.max(1, Math.floor(roomCount / 4)),
            description: description,
            isPreset: false,
            thumbnail: null,
            objects: objects,
            createdAt: Date.now()
        };

        return template;
    }
};
