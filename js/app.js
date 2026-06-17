const App = {
    tools: {},
    renderers: {},
    lastMouseX: 0,
    lastMouseY: 0,
    spacePressed: false,
    colorPanelVisible: false,
    tempColor: null,

    presetColors: [
        '#a8d8ea', '#aa96da', '#fcbad3', '#d5ecc2', '#ffd3b6', '#c7ceea',
        '#b8e0d2', '#d6e2f0', '#e8d5b7', '#f0d9da', '#c9d8c5', '#e6f3ff',
        '#f5e6d3', '#d0e8f2', '#e8d5c4', '#f0f8ff', '#e6f7ff', '#f0f0f0',
        '#e0f7fa', '#fce4ec', '#f3e5f5', '#e8eaf6', '#e0f2f1', '#fff3e0',
        '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#f3f4f6', '#ffffff',
        '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'
    ],

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
        this.setupColorPanel();
        this.setupZoomControl();

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

    setupColorPanel() {
        const colorStatusItem = document.getElementById('color-status-item');
        const colorPanel = document.getElementById('color-panel');
        const colorPanelClose = document.getElementById('color-panel-close');
        const presetGrid = document.getElementById('color-preset-grid');
        const customColorPicker = document.getElementById('custom-color-picker');
        const customColorInput = document.getElementById('custom-color-input');
        const batchColorBtn = document.getElementById('batch-color-btn');

        this.presetColors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.dataset.color = color;
            swatch.addEventListener('click', () => {
                const obj = Store.getObject(Store.selection.objectId);
                if (obj && obj.type === 'furniture' && obj.color !== color) {
                    const oldColor = obj.color;
                    Store.updateObject(obj.id, { color: color });
                    const cmd = new ChangeColorCommand(obj.id, oldColor, color);
                    CommandManager.execute(cmd);
                    this.tempColor = null;
                    this.updateColorPanelValues(color);
                }
            });
            presetGrid.appendChild(swatch);
        });

        colorStatusItem.addEventListener('click', () => {
            if (Store.selection.objectId && Store.selection.type === 'furniture') {
                this.toggleColorPanel();
            }
        });

        colorPanelClose.addEventListener('click', () => {
            this.hideColorPanel();
        });

        customColorPicker.addEventListener('input', (e) => {
            const color = e.target.value;
            customColorInput.value = color;
            this.applyColorToSelection(color, true);
            this.updateActiveSwatch(color);
        });

        customColorPicker.addEventListener('change', (e) => {
            const color = e.target.value;
            this.commitColorChange(color);
        });

        customColorInput.addEventListener('input', (e) => {
            let value = e.target.value;
            if (!value.startsWith('#')) {
                value = '#' + value;
            }
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                customColorPicker.value = value;
                this.applyColorToSelection(value, true);
                this.updateActiveSwatch(value);
            }
        });

        customColorInput.addEventListener('blur', (e) => {
            let value = e.target.value;
            if (!value.startsWith('#')) {
                value = '#' + value;
            }
            if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                this.commitColorChange(value);
            } else {
                const obj = Store.getObject(Store.selection.objectId);
                if (obj) {
                    customColorInput.value = obj.color;
                    customColorPicker.value = obj.color;
                }
            }
        });

        customColorInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.target.blur();
            }
        });

        batchColorBtn.addEventListener('click', () => {
            this.applyBatchColor();
        });
    },

    toggleColorPanel() {
        const colorPanel = document.getElementById('color-panel');
        if (this.colorPanelVisible) {
            this.hideColorPanel();
        } else {
            this.showColorPanel();
        }
    },

    showColorPanel() {
        const colorPanel = document.getElementById('color-panel');
        const obj = Store.getObject(Store.selection.objectId);
        if (obj && obj.type === 'furniture') {
            colorPanel.style.display = 'block';
            this.colorPanelVisible = true;
            this.updateColorPanelValues(obj.color);
        }
    },

    hideColorPanel() {
        const colorPanel = document.getElementById('color-panel');
        colorPanel.style.display = 'none';
        this.colorPanelVisible = false;
    },

    updateColorPanelValues(color) {
        const customColorPicker = document.getElementById('custom-color-picker');
        const customColorInput = document.getElementById('custom-color-input');
        const colorPreview = document.getElementById('color-preview');
        const colorHexValue = document.getElementById('color-hex-value');

        customColorPicker.value = color;
        customColorInput.value = color;
        colorPreview.style.backgroundColor = color;
        colorHexValue.textContent = color;

        this.updateActiveSwatch(color);
    },

    updateActiveSwatch(color) {
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.classList.toggle('active', swatch.dataset.color.toLowerCase() === color.toLowerCase());
        });
    },

    startColorPreview(color) {
        const obj = Store.getObject(Store.selection.objectId);
        if (obj && obj.type === 'furniture') {
            this.tempColor = {
                objectId: obj.id,
                oldColor: obj.color,
                newColor: color
            };
            Store.updateObject(obj.id, { color: color });
        }
    },

    commitColorPreview() {
        if (this.tempColor) {
            const cmd = new ChangeColorCommand(
                this.tempColor.objectId,
                this.tempColor.oldColor,
                this.tempColor.newColor
            );
            CommandManager.execute(cmd);
            this.tempColor = null;
            this.updateColorPanelValues(cmd.newColor);
        }
    },

    cancelColorPreview() {
        if (this.tempColor) {
            Store.updateObject(this.tempColor.objectId, { color: this.tempColor.oldColor });
            this.tempColor = null;
        }
    },

    applyColorToSelection(color, isPreview = false) {
        const obj = Store.getObject(Store.selection.objectId);
        if (obj && obj.type === 'furniture') {
            if (isPreview) {
                if (!this.tempColor) {
                    this.tempColor = {
                        objectId: obj.id,
                        oldColor: obj.color,
                        newColor: color
                    };
                } else {
                    this.tempColor.newColor = color;
                }
            }
            Store.updateObject(obj.id, { color: color });
            this.updateColorPanelValues(color);
        }
    },

    commitColorChange(newColor) {
        const obj = Store.getObject(Store.selection.objectId);
        if (obj && obj.type === 'furniture') {
            if (this.tempColor && this.tempColor.oldColor !== newColor) {
                const cmd = new ChangeColorCommand(
                    this.tempColor.objectId,
                    this.tempColor.oldColor,
                    newColor
                );
                CommandManager.execute(cmd);
            } else if (!this.tempColor && obj.color !== newColor) {
                const oldColor = obj.color;
                Store.updateObject(obj.id, { color: newColor });
                const cmd = new ChangeColorCommand(obj.id, oldColor, newColor);
                CommandManager.execute(cmd);
            }
            this.tempColor = null;
            this.updateColorPanelValues(newColor);
        }
    },

    applyBatchColor() {
        const selectedObj = Store.getObject(Store.selection.objectId);
        if (!selectedObj || selectedObj.type !== 'furniture') return;

        const targetColor = selectedObj.color;
        const furnitureType = selectedObj.furnitureType;

        const sameTypeObjects = Store.objects.filter(
            obj => obj.type === 'furniture' && obj.furnitureType === furnitureType && obj.id !== selectedObj.id
        );

        if (sameTypeObjects.length === 0) {
            alert('没有其他同类型的家具');
            return;
        }

        const objectIds = sameTypeObjects.map(obj => obj.id);
        const oldColors = sameTypeObjects.map(obj => obj.color);

        const cmd = new BatchChangeColorCommand(objectIds, oldColors, targetColor);
        CommandManager.execute(cmd);

        alert(`已修改 ${sameTypeObjects.length} 个同类型家具的颜色`);
    },

    updateColorStatus() {
        const colorStatusItem = document.getElementById('color-status-item');
        const colorPreview = document.getElementById('color-preview');
        const colorHexValue = document.getElementById('color-hex-value');

        if (Store.selection.objectId && Store.selection.type === 'furniture') {
            const obj = Store.getObject(Store.selection.objectId);
            if (obj) {
                colorStatusItem.style.display = 'flex';
                colorPreview.style.backgroundColor = obj.color;
                colorHexValue.textContent = obj.color;
            }
        } else {
            colorStatusItem.style.display = 'none';
            if (this.colorPanelVisible) {
                this.hideColorPanel();
            }
        }
    },

    setupZoomControl() {
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomPercentBtn = document.getElementById('zoom-percent');
        const zoomResetBtn = document.getElementById('zoom-reset');
        const zoomFitBtn = document.getElementById('zoom-fit');
        const zoomInputOverlay = document.getElementById('zoom-input-overlay');
        const zoomInputValue = document.getElementById('zoom-input-value');

        zoomOutBtn.addEventListener('click', () => {
            this.zoomAtCenter(0.9);
        });

        zoomInBtn.addEventListener('click', () => {
            this.zoomAtCenter(1.1);
        });

        zoomPercentBtn.addEventListener('click', () => {
            zoomInputOverlay.style.display = 'flex';
            zoomInputValue.value = Math.round(Store.canvas.scale * 100);
            zoomInputValue.focus();
            zoomInputValue.select();
        });

        zoomResetBtn.addEventListener('click', () => {
            this.zoomTo(1);
        });

        zoomFitBtn.addEventListener('click', () => {
            this.zoomToFit();
        });

        zoomInputOverlay.addEventListener('click', (e) => {
            if (e.target === zoomInputOverlay) {
                zoomInputOverlay.style.display = 'none';
            }
        });

        zoomInputValue.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const value = parseInt(zoomInputValue.value);
                if (!isNaN(value) && value >= 25 && value <= 400) {
                    this.zoomTo(value / 100);
                }
                zoomInputOverlay.style.display = 'none';
            } else if (e.key === 'Escape') {
                zoomInputOverlay.style.display = 'none';
            }
        });

        zoomInputValue.addEventListener('blur', () => {
            const value = parseInt(zoomInputValue.value);
            if (!isNaN(value) && value >= 25 && value <= 400) {
                this.zoomTo(value / 100);
            }
            zoomInputOverlay.style.display = 'none';
        });
    },

    zoomAtCenter(factor) {
        const centerX = Store.canvas.width / 2;
        const centerY = Store.canvas.height / 2;

        const worldBefore = Coordinates.screenToWorld(centerX, centerY);
        const newScale = Store.canvas.scale * factor;
        Store.setScale(newScale);
        const worldAfter = Coordinates.screenToWorld(centerX, centerY);

        const offsetDx = (worldAfter.x - worldBefore.x) * Store.canvas.scale;
        const offsetDy = (worldAfter.y - worldBefore.y) * Store.canvas.scale;
        Store.setOffset(
            Store.canvas.offsetX - offsetDx,
            Store.canvas.offsetY - offsetDy
        );

        this.updateZoomPercent();
    },

    zoomTo(scale) {
        const centerX = Store.canvas.width / 2;
        const centerY = Store.canvas.height / 2;

        const worldBefore = Coordinates.screenToWorld(centerX, centerY);
        Store.setScale(scale);
        const worldAfter = Coordinates.screenToWorld(centerX, centerY);

        const offsetDx = (worldAfter.x - worldBefore.x) * Store.canvas.scale;
        const offsetDy = (worldAfter.y - worldBefore.y) * Store.canvas.scale;
        Store.setOffset(
            Store.canvas.offsetX - offsetDx,
            Store.canvas.offsetY - offsetDy
        );

        this.updateZoomPercent();
    },

    zoomToFit() {
        if (Store.objects.length === 0) {
            this.zoomTo(1);
            Store.setOffset(0, 0);
            return;
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        Store.objects.forEach(obj => {
            if (obj.type === 'furniture' || obj.type === 'text') {
                const halfW = obj.width / 2;
                const halfH = obj.height / 2;
                minX = Math.min(minX, obj.x - halfW);
                minY = Math.min(minY, obj.y - halfH);
                maxX = Math.max(maxX, obj.x + halfW);
                maxY = Math.max(maxY, obj.y + halfH);
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
        });

        const padding = 100;
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        const scaleX = Store.canvas.width / contentWidth;
        const scaleY = Store.canvas.height / contentHeight;
        const scale = Math.min(scaleX, scaleY, 4);

        Store.setScale(scale);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        Store.setOffset(
            -centerX * scale,
            -centerY * scale
        );

        this.updateZoomPercent();
    },

    updateZoomPercent() {
        const zoomPercentBtn = document.getElementById('zoom-percent');
        const zoomLevel = document.getElementById('zoom-level');
        const percent = Math.round(Store.canvas.scale * 100) + '%';
        zoomPercentBtn.textContent = percent;
        zoomLevel.textContent = percent;
    },

    renderLoop() {
        this.renderers.grid.render();
        this.renderers.walls.render();
        this.renderers.furniture.render();
        this.renderers.annotations.render();
        this.renderers.ui.render();

        this.updateColorStatus();
        this.updateZoomPercent();

        requestAnimationFrame(() => this.renderLoop());
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
