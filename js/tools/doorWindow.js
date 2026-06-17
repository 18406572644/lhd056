const DoorWindowTool = {
    draggedItem: null,
    dragPreview: null,

    init() {
        this.setupDoorWindowList();
        this.setupDragAndDrop();
    },

    setupDoorWindowList() {
        this.renderCategory('door');

        document.querySelectorAll('#doorwindow-category-tabs .tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#doorwindow-category-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const category = e.target.dataset.category;
                this.renderCategory(category);
            });
        });
    },

    renderCategory(category) {
        const list = document.getElementById('doorwindow-list');
        if (!list) return;
        list.innerHTML = '';

        const items = DoorWindowLibrary[category] || [];
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'furniture-card';
            card.draggable = true;
            card.dataset.doorwindow = JSON.stringify(item);

            const thumb = document.createElement('div');
            thumb.className = 'furniture-thumb';
            const canvas = document.createElement('canvas');
            canvas.width = 80;
            canvas.height = 80;
            thumb.appendChild(canvas);

            const name = document.createElement('div');
            name.className = 'furniture-name';
            name.textContent = item.name;

            card.appendChild(thumb);
            card.appendChild(name);

            this.drawThumbnail(canvas, item);

            card.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, item);
            });

            card.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            list.appendChild(card);
        });
    },

    drawThumbnail(canvas, item) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const padding = 12;
        ctx.clearRect(0, 0, size, size);

        const isDoor = item.category === 'door';

        if (isDoor) {
            this.drawDoorThumbnail(ctx, item, size, padding);
        } else {
            this.drawWindowThumbnail(ctx, item, size, padding);
        }

        ctx.fillStyle = '#374151';
        ctx.font = `${size * 0.18}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.name, size / 2, size - padding - 4);
    },

    drawDoorThumbnail(ctx, item, size, padding) {
        const w = size - padding * 2;
        const h = (size - padding * 2) * 0.6;
        const cx = size / 2;
        const cy = size / 2 - 6;

        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;

        if (item.id === 'single-door') {
            ctx.beginPath();
            ctx.moveTo(cx - w / 2, cy + h / 2);
            ctx.lineTo(cx - w / 2, cy - h / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx - w / 2, cy - h / 2, w, -Math.PI / 2, 0);
            ctx.strokeStyle = item.color + '88';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(cx - w / 2, cy - h / 2);
            ctx.lineTo(cx - w / 2 + w, cy - h / 2 + w);
            ctx.strokeStyle = item.color;
            ctx.stroke();
        } else if (item.id === 'double-door') {
            const halfW = w / 2;

            ctx.beginPath();
            ctx.moveTo(cx - halfW, cy + h / 2);
            ctx.lineTo(cx - halfW, cy - h / 2);
            ctx.lineTo(cx, cy - h / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + halfW, cy + h / 2);
            ctx.lineTo(cx + halfW, cy - h / 2);
            ctx.lineTo(cx, cy - h / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx - halfW, cy - h / 2, halfW, -Math.PI / 2, 0);
            ctx.strokeStyle = item.color + '88';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.arc(cx + halfW, cy - h / 2, halfW, Math.PI, -Math.PI / 2, true);
            ctx.strokeStyle = item.color + '88';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (item.id === 'sliding-door') {
            ctx.beginPath();
            ctx.moveTo(cx - w / 2, cy + h / 2);
            ctx.lineTo(cx - w / 2, cy - h / 2);
            ctx.lineTo(cx + w / 2, cy - h / 2);
            ctx.lineTo(cx + w / 2, cy + h / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx, cy - h / 2);
            ctx.lineTo(cx, cy + h / 2);
            ctx.strokeStyle = item.color + '88';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.beginPath();
            ctx.moveTo(cx - w / 4, cy - h / 2 + 3);
            ctx.lineTo(cx - w / 4, cy + h / 2 - 3);
            ctx.strokeStyle = item.color;
            ctx.setLineDash([]);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(cx + w / 4, cy - h / 2 + 3);
            ctx.lineTo(cx + w / 4, cy + h / 2 - 3);
            ctx.strokeStyle = item.color;
            ctx.stroke();
        }
    },

    drawWindowThumbnail(ctx, item, size, padding) {
        const w = size - padding * 2;
        const h = (size - padding * 2) * 0.4;
        const cx = size / 2;
        const cy = size / 2 - 6;

        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;

        if (item.id === 'casement-window') {
            ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

            ctx.beginPath();
            ctx.moveTo(cx, cy - h / 2);
            ctx.lineTo(cx, cy + h / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx - w / 2, cy - h / 2, w / 2, -Math.PI / 2, 0);
            ctx.strokeStyle = item.color + '66';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (item.id === 'sliding-window') {
            ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);

            ctx.beginPath();
            ctx.moveTo(cx, cy - h / 2);
            ctx.lineTo(cx, cy + h / 2);
            ctx.strokeStyle = item.color + '88';
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = item.color + '33';
            ctx.fillRect(cx - w / 2, cy - h / 2, w / 2, h);
        }
    },

    setupDragAndDrop() {
        const canvas = document.getElementById('canvas-ui');

        canvas.addEventListener('dragover', (e) => {
            if (!this.draggedItem) return;
            e.preventDefault();
            this.handleDragOver(e);
        });

        canvas.addEventListener('drop', (e) => {
            if (!this.draggedItem) return;
            e.preventDefault();
            this.handleDrop(e);
        });
    },

    handleDragStart(e, item) {
        this.draggedItem = item;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(item));
    },

    findNearestWall(worldX, worldY, threshold) {
        const objects = Store.getCurrentObjects();
        let nearestWall = null;
        let minDist = threshold;

        objects.forEach(obj => {
            if (obj.type !== 'wall') return;
            const dist = Collision.pointToLineDistance(worldX, worldY, obj.x1, obj.y1, obj.x2, obj.y2);
            if (dist < minDist) {
                minDist = dist;
                nearestWall = obj;
            }
        });

        return nearestWall;
    },

    getWallSnapPosition(worldX, worldY, wall, doorWindowWidth) {
        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const wallLen = Math.sqrt(dx * dx + dy * dy);

        if (wallLen === 0) return null;

        const t = ((worldX - wall.x1) * dx + (worldY - wall.y1) * dy) / (wallLen * wallLen);
        const clampedT = Math.max(doorWindowWidth / (2 * wallLen), Math.min(1 - doorWindowWidth / (2 * wallLen), t));

        const projX = wall.x1 + clampedT * dx;
        const projY = wall.y1 + clampedT * dy;

        const angle = Math.atan2(dy, dx);

        return {
            x: projX,
            y: projY,
            t: clampedT,
            angle: angle,
            wallId: wall.id
        };
    },

    handleDragOver(e) {
        if (!this.draggedItem) return;
        e.dataTransfer.dropEffect = 'copy';

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const wall = this.findNearestWall(world.x, world.y, 30);

        if (wall) {
            const snapPos = this.getWallSnapPosition(world.x, world.y, wall, this.draggedItem.width);
            if (snapPos) {
                Store.dragState.tempObject = {
                    id: 'temp',
                    type: 'doorWindow',
                    doorWindowType: this.draggedItem.id,
                    x: snapPos.x,
                    y: snapPos.y,
                    width: this.draggedItem.width,
                    height: this.draggedItem.height,
                    objectHeight: this.draggedItem.objectHeight,
                    color: this.draggedItem.color,
                    icon: this.draggedItem.icon,
                    wallId: snapPos.wallId,
                    wallT: snapPos.t,
                    angle: snapPos.angle,
                    openDirection: this.draggedItem.openDirection,
                    category: this.draggedItem.category,
                    rotation: 0,
                    _snapped: true
                };
                return;
            }
        }

        Store.dragState.tempObject = null;
    },

    handleDrop(e) {
        if (!this.draggedItem) return;

        const tempObj = Store.dragState.tempObject;
        if (!tempObj || !tempObj._snapped) {
            this.handleDragEnd();
            return;
        }

        const doorWindow = {
            id: Store.generateId('doorWindow'),
            type: 'doorWindow',
            doorWindowType: this.draggedItem.id,
            x: tempObj.x,
            y: tempObj.y,
            width: this.draggedItem.width,
            height: this.draggedItem.height,
            objectHeight: this.draggedItem.objectHeight,
            color: this.draggedItem.color,
            icon: this.draggedItem.icon,
            wallId: tempObj.wallId,
            wallT: tempObj.wallT,
            angle: tempObj.angle,
            openDirection: this.draggedItem.openDirection,
            category: this.draggedItem.category,
            rotation: 0,
            createdAt: Date.now()
        };

        CommandManager.execute(new CreateObjectCommand(doorWindow));
        Store.selectObject(doorWindow.id, 'doorWindow');
        Store.setTool('select');
        this.updateToolButton('select');

        this.handleDragEnd();
    },

    handleDragEnd(e) {
        this.draggedItem = null;
        Store.dragState.tempObject = null;
    },

    updateToolButton(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    },

    updateDoorWindowPosition(doorWindow) {
        const wall = Store.getObject(doorWindow.wallId);
        if (!wall) return;

        const dx = wall.x2 - wall.x1;
        const dy = wall.y2 - wall.y1;
        const wallLen = Math.sqrt(dx * dx + dy * dy);
        if (wallLen === 0) return;

        const angle = Math.atan2(dy, dx);

        doorWindow.x = wall.x1 + doorWindow.wallT * dx;
        doorWindow.y = wall.y1 + doorWindow.wallT * dy;
        doorWindow.angle = angle;
    },

    handleMouseDown(e) {},
    handleMouseMove(e) {},
    handleMouseUp(e) {}
};
