const ComponentLibrary = {
    currentCategory: '常用',
    draggedComponent: null,
    dragPreview: null,

    init() {
        this.setupCategoryTabs();
        this.setupDragAndDrop();
        this.renderComponents();
    },

    setupCategoryTabs() {
        const tabsContainer = document.getElementById('component-category-tabs');
        if (!tabsContainer) return;

        const categories = Store.componentLibrary.categories;
        tabsContainer.innerHTML = '';

        categories.forEach((cat, index) => {
            const tab = document.createElement('div');
            tab.className = 'tab-btn' + (index === 0 ? ' active' : '');
            tab.dataset.category = cat;
            tab.textContent = cat;
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('#component-category-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = cat;
                this.renderComponents();
            });
            tabsContainer.appendChild(tab);
        });
    },

    renderComponents() {
        const list = document.getElementById('component-list');
        if (!list) return;

        list.innerHTML = '';

        const components = Store.componentLibrary.components.filter(
            c => c.category === this.currentCategory
        );

        if (components.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'component-empty';
            empty.innerHTML = `
                <div class="empty-icon">📦</div>
                <div class="empty-text">暂无组件</div>
                <div class="empty-hint">选中组合后右键保存到组件库</div>
            `;
            list.appendChild(empty);
            return;
        }

        components.forEach(component => {
            const card = document.createElement('div');
            card.className = 'component-card';
            card.draggable = true;
            card.dataset.componentId = component.id;

            const thumb = document.createElement('div');
            thumb.className = 'component-thumb';
            const img = document.createElement('img');
            img.src = component.thumbnail;
            img.alt = component.name;
            thumb.appendChild(img);

            const name = document.createElement('div');
            name.className = 'component-name';
            name.textContent = component.name;

            const actions = document.createElement('div');
            actions.className = 'component-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'component-delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = '删除组件';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`确定要删除组件"${component.name}"吗？`)) {
                    CommandManager.execute(new DeleteComponentCommand(component.id));
                    this.renderComponents();
                }
            });
            actions.appendChild(deleteBtn);

            card.appendChild(thumb);
            card.appendChild(name);
            card.appendChild(actions);

            card.addEventListener('dragstart', (e) => {
                this.handleDragStart(e, component);
            });

            card.addEventListener('dragend', (e) => {
                this.handleDragEnd(e);
            });

            card.addEventListener('dblclick', () => {
                this.editComponent(component);
            });

            list.appendChild(card);
        });
    },

    handleDragStart(e, component) {
        this.draggedComponent = component;
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'component', id: component.id }));

        this.dragPreview = document.createElement('div');
        this.dragPreview.className = 'drag-preview';
        this.dragPreview.style.width = '100px';
        this.dragPreview.style.height = '100px';
        this.dragPreview.style.background = '#ffffff';
        this.dragPreview.style.borderRadius = '8px';
        this.dragPreview.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        this.dragPreview.style.display = 'flex';
        this.dragPreview.style.alignItems = 'center';
        this.dragPreview.style.justifyContent = 'center';
        
        const img = document.createElement('img');
        img.src = component.thumbnail;
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'contain';
        this.dragPreview.appendChild(img);

        document.body.appendChild(this.dragPreview);
    },

    handleDragEnd(e) {
        this.draggedComponent = null;
        if (this.dragPreview) {
            document.body.removeChild(this.dragPreview);
            this.dragPreview = null;
        }
    },

    setupDragAndDrop() {
        const canvas = document.getElementById('canvas-ui');
        if (!canvas) return;

        canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.handleDragOver(e);
        });

        canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleDrop(e);
        });
    },

    handleDragOver(e) {
        if (!this.draggedComponent) return;
        e.dataTransfer.dropEffect = 'copy';

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);
        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        const compData = this.draggedComponent.data;
        if (compData) {
            const tempGroup = JSON.parse(JSON.stringify(compData));
            const offsetX = snapped.x - tempGroup.x;
            const offsetY = snapped.y - tempGroup.y;
            
            if (tempGroup.children) {
                tempGroup.children.forEach(child => {
                    if (child.type === 'furniture' || child.type === 'text') {
                        child.x += offsetX;
                        child.y += offsetY;
                    } else if (child.type === 'group') {
                        this.offsetGroup(child, offsetX, offsetY);
                    }
                });
            }
            
            tempGroup.x = snapped.x;
            tempGroup.y = snapped.y;
            tempGroup.id = 'temp-component';
            
            Store.dragState.tempObject = tempGroup;
        }

        if (this.dragPreview) {
            this.dragPreview.style.left = (e.clientX - 50) + 'px';
            this.dragPreview.style.top = (e.clientY - 50) + 'px';
        }
    },

    offsetGroup(group, dx, dy) {
        if (group.children) {
            group.children.forEach(child => {
                if (child.type === 'furniture' || child.type === 'text') {
                    child.x += dx;
                    child.y += dy;
                } else if (child.type === 'group') {
                    this.offsetGroup(child, dx, dy);
                }
            });
        }
        if (group.x !== undefined) {
            group.x += dx;
            group.y += dy;
        }
    },

    handleDrop(e) {
        if (!this.draggedComponent) return;

        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);
        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);

        const compData = this.draggedComponent.data;
        if (compData) {
            const newGroup = this.cloneComponentData(compData);
            const offsetX = snapped.x - newGroup.x;
            const offsetY = snapped.y - newGroup.y;
            
            this.offsetGroup(newGroup, offsetX, offsetY);
            
            if (Store.groupEditPath.length > 0) {
                const parent = Store.getCurrentGroup();
                if (parent) {
                    parent.children.push(newGroup);
                }
            } else {
                Store.objects.push(newGroup);
            }
            
            Store.selectObject(newGroup.id, 'group');
            Store.setTool('select');
        }

        this.handleDragEnd();
    },

    cloneComponentData(data) {
        const clone = JSON.parse(JSON.stringify(data));
        this.regenerateIds(clone);
        return clone;
    },

    regenerateIds(obj) {
        if (obj.id) {
            obj.id = Store.generateId(obj.type || 'obj');
        }
        if (obj.children && Array.isArray(obj.children)) {
            obj.children.forEach(child => this.regenerateIds(child));
        }
    },

    editComponent(component) {
        const newName = prompt('修改组件名称:', component.name);
        if (newName && newName.trim()) {
            Store.updateComponent(component.id, { name: newName.trim() });
            this.renderComponents();
        }
    },

    refresh() {
        this.renderComponents();
    },

    showPanel() {
        const panel = document.getElementById('component-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    },

    hidePanel() {
        const panel = document.getElementById('component-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    }
};

window.ComponentLibrary = ComponentLibrary;
