const FurnitureTool = {
    draggedFurniture: null,
    dragPreview: null,

    init() {
        this.setupFurnitureList();
        this.setupDragAndDrop();
    },

    setupFurnitureList() {
        const list = document.getElementById('furniture-list');
        this.renderCategory('living');

        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const category = e.target.dataset.category;
                this.renderCategory(category);
            });
        });
    },

    renderCategory(category) {
        const list = document.getElementById('furniture-list');
        list.innerHTML = '';

        const items = FurnitureLibrary[category] || [];
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'furniture-card';
            card.draggable = true;
            card.dataset.furniture = JSON.stringify(item);

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

            FurnitureRenderer.drawThumbnail(canvas, item);

            card.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, item);
            });

            card.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            list.appendChild(card);
        });
    },

    setupDragAndDrop() {
        const canvas = document.getElementById('canvas-ui');

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
    },

    handleDragStart(e, furniture) {
        this.draggedFurniture = furniture;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(furniture));

        this.dragPreview = document.createElement('canvas');
        this.dragPreview.className = 'drag-preview';
        this.dragPreview.width = 100;
        this.dragPreview.height = 100;
        FurnitureRenderer.drawThumbnail(this.dragPreview, furniture);
        document.body.appendChild(this.dragPreview);
    },

    handleDragOver(e) {
        if (!this.draggedFurniture) return;
        e.dataTransfer.dropEffect = 'copy';

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);
        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        Store.dragState.tempObject = {
            id: 'temp',
            type: 'furniture',
            category: this.draggedFurniture.id.split('-')[0],
            furnitureType: this.draggedFurniture.id,
            x: snapped.x,
            y: snapped.y,
            width: this.draggedFurniture.width,
            height: this.draggedFurniture.height,
            color: this.draggedFurniture.color,
            icon: this.draggedFurniture.icon,
            rotation: 0
        };

        if (this.dragPreview) {
            this.dragPreview.style.left = (e.clientX - 50) + 'px';
            this.dragPreview.style.top = (e.clientY - 50) + 'px';
        }
    },

    handleDrop(e) {
        if (!this.draggedFurniture) return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);
        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        const furniture = {
            id: Store.generateId('furniture'),
            type: 'furniture',
            category: this.draggedFurniture.id.split('-')[0],
            furnitureType: this.draggedFurniture.id,
            x: snapped.x,
            y: snapped.y,
            width: this.draggedFurniture.width,
            height: this.draggedFurniture.height,
            color: this.draggedFurniture.color,
            icon: this.draggedFurniture.icon,
            rotation: 0,
            createdAt: Date.now()
        };

        CommandManager.execute(new CreateObjectCommand(furniture));
        Store.selectObject(furniture.id, 'furniture');
        Store.setTool('select');
        this.updateToolButton('select');

        this.handleDragEnd();
    },

    handleDragEnd(e) {
        this.draggedFurniture = null;
        Store.dragState.tempObject = null;
        if (this.dragPreview) {
            document.body.removeChild(this.dragPreview);
            this.dragPreview = null;
        }
    },

    updateToolButton(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    },

    handleMouseDown(e) {
    },

    handleMouseMove(e) {
    },

    handleMouseUp(e) {
    }
};
