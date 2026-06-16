const App = {
    tools: {},
    renderers: {},
    lastMouseX: 0,
    lastMouseY: 0,
    spacePressed: false,

    init() {
        Store.init();

        this.tools = {
            select: SelectTool,
            wall: WallTool,
            room: RoomTool,
            furniture: FurnitureTool,
            dimension: DimensionTool,
            text: TextTool
        };

        this.renderers = {
            grid: GridRenderer,
            walls: WallRenderer,
            furniture: FurnitureRenderer,
            annotations: AnnotationRenderer,
            ui: UIRenderer
        };

        Object.values(this.renderers).forEach(r => r.init());

        this.tools.furniture.init();

        this.setupEventListeners();
        this.setupToolButtons();
        this.setupExportButton();

        this.renderLoop();
    },

    setupEventListeners() {
        const canvas = document.getElementById('canvas-ui');

        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));

        canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        canvas.addEventListener('mousedown', (e) => this.handleMiddleMouseDown(e), true);

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        window.addEventListener('resize', () => this.handleResize());
    },

    setupToolButtons() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.currentTarget.dataset.tool;
                this.setTool(tool);
            });
        });
    },

    setupExportButton() {
        const exportBtn = document.getElementById('export-btn');
        exportBtn.addEventListener('click', () => {
            ExportUtils.exportToPNG();
        });
    },

    setTool(tool) {
        Store.setTool(tool);
        Store.clearSelection();
        Store.previewObject = null;
        Store.dimensionStart = null;
        Store.dragState.isDragging = false;

        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
    },

    handleMouseDown(e) {
        if (e.button !== 0) return;
        if (Store.panState.isPanning) return;

        const tool = this.tools[Store.currentTool];
        if (tool && tool.handleMouseDown) {
            tool.handleMouseDown(e);
        }
    },

    handleMouseMove(e) {
        const rect = e.target.getBoundingClientRect();
        this.lastMouseX = e.clientX - rect.left;
        this.lastMouseY = e.clientY - rect.top;

        this.updateStatusBar();

        if (Store.panState.isPanning) {
            const dx = e.clientX - Store.panState.startX;
            const dy = e.clientY - Store.panState.startY;
            Store.setOffset(
                Store.panState.startOffsetX + dx,
                Store.panState.startOffsetY + dy
            );
            return;
        }

        if (this.spacePressed) {
            return;
        }

        const tool = this.tools[Store.currentTool];
        if (tool && tool.handleMouseMove) {
            tool.handleMouseMove(e);
        }
    },

    handleMouseUp(e) {
        if (Store.panState.isPanning) {
            Store.panState.isPanning = false;
            return;
        }

        const tool = this.tools[Store.currentTool];
        if (tool && tool.handleMouseUp) {
            tool.handleMouseUp(e);
        }
    },

    handleMiddleMouseDown(e) {
        if (e.button === 1 || (e.button === 0 && this.spacePressed)) {
            e.preventDefault();
            Store.panState.isPanning = true;
            Store.panState.startX = e.clientX;
            Store.panState.startY = e.clientY;
            Store.panState.startOffsetX = Store.canvas.offsetX;
            Store.panState.startOffsetY = Store.canvas.offsetY;
        }
    },

    handleWheel(e) {
        e.preventDefault();

        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldBefore = Coordinates.screenToWorld(mouseX, mouseY);

        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Store.canvas.scale * delta;
        Store.setScale(newScale);

        const worldAfter = Coordinates.screenToWorld(mouseX, mouseY);

        const offsetDx = (worldAfter.x - worldBefore.x) * Store.canvas.scale;
        const offsetDy = (worldAfter.y - worldBefore.y) * Store.canvas.scale;
        Store.setOffset(
            Store.canvas.offsetX - offsetDx,
            Store.canvas.offsetY - offsetDy
        );
    },

    handleKeyDown(e) {
        if (e.code === 'Space' && !this.spacePressed) {
            this.spacePressed = true;
            document.getElementById('canvas-ui').style.cursor = 'grab';
        }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                CommandManager.undo();
                return;
            }
            if ((e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                CommandManager.redo();
                return;
            }
        }

        if (e.key === 'v' || e.key === 'V') {
            this.setTool('select');
        } else if (e.key === 'w' || e.key === 'W') {
            this.setTool('wall');
        } else if (e.key === 'r' || e.key === 'R') {
            this.setTool('room');
        } else if (e.key === 'f' || e.key === 'F') {
            this.setTool('furniture');
        } else if (e.key === 'd' || e.key === 'D') {
            this.setTool('dimension');
        } else if (e.key === 't' || e.key === 'T') {
            this.setTool('text');
        }

        if (e.key === 'Escape') {
            Store.clearSelection();
            Store.previewObject = null;
            Store.dimensionStart = null;
            Store.dragState.isDragging = false;
            this.setTool('select');
        }

        const tool = this.tools[Store.currentTool];
        if (tool && tool.handleKeyDown) {
            tool.handleKeyDown(e);
        }
    },

    handleKeyUp(e) {
        if (e.code === 'Space') {
            this.spacePressed = false;
            document.getElementById('canvas-ui').style.cursor = 'default';
        }
    },

    handleResize() {
        Store.canvas.width = window.innerWidth;
        Store.canvas.height = window.innerHeight;

        Object.values(this.renderers).forEach(r => r.resize());
    },

    updateStatusBar() {
        const world = Coordinates.screenToWorld(this.lastMouseX, this.lastMouseY);
        const coordEl = document.getElementById('cursor-coord');
        coordEl.textContent = `X: ${(world.x / 100).toFixed(2)}m, Y: ${(world.y / 100).toFixed(2)}m`;

        const zoomEl = document.getElementById('zoom-level');
        zoomEl.textContent = `${Math.round(Store.canvas.scale * 100)}%`;

        const selEl = document.getElementById('selection-info');
        if (Store.selection.objectId) {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj) {
                selEl.textContent = this.getSelectionInfo(obj);
            } else {
                selEl.textContent = '无';
            }
        } else {
            selEl.textContent = '无';
        }
    },

    getSelectionInfo(obj) {
        const typeNames = {
            wall: '墙壁',
            furniture: '家具',
            dimension: '尺寸',
            text: '文字'
        };

        const typeName = typeNames[obj.type] || obj.type;

        if (obj.type === 'wall') {
            const len = Math.sqrt(
                Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2)
            );
            return `${typeName} | 长度: ${Coordinates.formatDimension(len)} | 厚度: ${obj.thickness}cm`;
        } else if (obj.type === 'furniture') {
            return `${typeName} | ${Coordinates.formatDimension(obj.width)} × ${Coordinates.formatDimension(obj.height)} | 位置: (${(obj.x / 100).toFixed(2)}m, ${(obj.y / 100).toFixed(2)}m)`;
        } else if (obj.type === 'dimension') {
            const len = Math.sqrt(
                Math.pow(obj.x2 - obj.x1, 2) + Math.pow(obj.y2 - obj.y1, 2)
            );
            return `${typeName} | 距离: ${Coordinates.formatDimension(len)}`;
        } else if (obj.type === 'text') {
            return `${typeName} | "${obj.content}" | 位置: (${(obj.x / 100).toFixed(2)}m, ${(obj.y / 100).toFixed(2)}m)`;
        }

        return typeName;
    },

    renderLoop() {
        this.renderers.grid.render();
        this.renderers.walls.render();
        this.renderers.furniture.render();
        this.renderers.annotations.render();
        this.renderers.ui.render();

        requestAnimationFrame(() => this.renderLoop());
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
