const TemplateLibraryUI = {
    currentCategory: '全部',
    searchKeyword: '',
    minArea: null,
    maxArea: null,
    minRooms: null,
    maxRooms: null,
    showPrivateOnly: false,

    init() {
        this.setupCategoryTabs();
        this.setupSearch();
        this.setupFilters();
        this.setupNewButton();
        this.setupSaveButton();
        this.setupCloseButton();
        this.renderTemplates();
    },

    setupCategoryTabs() {
        const tabsContainer = document.getElementById('template-category-tabs');
        if (!tabsContainer) return;

        const categories = ['全部', ...TemplateLibrary.categories];
        tabsContainer.innerHTML = '';

        categories.forEach((cat, index) => {
            const tab = document.createElement('div');
            tab.className = 'tab-btn' + (index === 0 ? ' active' : '');
            tab.dataset.category = cat;
            tab.textContent = cat;
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('#template-category-tabs .tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = cat;
                this.renderTemplates();
            });
            tabsContainer.appendChild(tab);
        });
    },

    setupSearch() {
        const searchInput = document.getElementById('template-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            this.searchKeyword = e.target.value.trim();
            this.renderTemplates();
        });
    },

    setupFilters() {
        const minAreaInput = document.getElementById('filter-min-area');
        const maxAreaInput = document.getElementById('filter-max-area');
        const minRoomsInput = document.getElementById('filter-min-rooms');
        const maxRoomsInput = document.getElementById('filter-max-rooms');
        const privateToggle = document.getElementById('filter-private-only');

        if (minAreaInput) {
            minAreaInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.minArea = isNaN(val) || val <= 0 ? null : val;
                this.renderTemplates();
            });
        }

        if (maxAreaInput) {
            maxAreaInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.maxArea = isNaN(val) || val <= 0 ? null : val;
                this.renderTemplates();
            });
        }

        if (minRoomsInput) {
            minRoomsInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.minRooms = isNaN(val) || val <= 0 ? null : val;
                this.renderTemplates();
            });
        }

        if (maxRoomsInput) {
            maxRoomsInput.addEventListener('input', (e) => {
                const val = parseInt(e.target.value);
                this.maxRooms = isNaN(val) || val <= 0 ? null : val;
                this.renderTemplates();
            });
        }

        if (privateToggle) {
            privateToggle.addEventListener('change', (e) => {
                this.showPrivateOnly = e.target.checked;
                this.renderTemplates();
            });
        }
    },

    setupNewButton() {
        const newBtn = document.getElementById('new-template-btn');
        if (!newBtn) return;

        newBtn.addEventListener('click', () => {
            this.showPanel();
        });
    },

    setupSaveButton() {
        const saveBtn = document.getElementById('save-as-template-btn');
        if (!saveBtn) return;

        saveBtn.addEventListener('click', () => {
            this.showSaveTemplateDialog();
        });
    },

    setupCloseButton() {
        const closeBtn = document.getElementById('template-panel-close');
        if (!closeBtn) return;

        closeBtn.addEventListener('click', () => {
            this.hidePanel();
        });
    },

    getFilteredTemplates() {
        let templates = TemplateLibrary.getAllTemplates();

        if (this.currentCategory && this.currentCategory !== '全部') {
            templates = templates.filter(t => t.category === this.currentCategory);
        }

        if (this.searchKeyword) {
            const lower = this.searchKeyword.toLowerCase();
            templates = templates.filter(t =>
                t.name.toLowerCase().includes(lower) ||
                t.description.toLowerCase().includes(lower)
            );
        }

        if (this.minArea !== null) {
            templates = templates.filter(t => t.area >= this.minArea);
        }
        if (this.maxArea !== null) {
            templates = templates.filter(t => t.area <= this.maxArea);
        }

        if (this.minRooms !== null) {
            templates = templates.filter(t => t.roomCount >= this.minRooms);
        }
        if (this.maxRooms !== null) {
            templates = templates.filter(t => t.roomCount <= this.maxRooms);
        }

        if (this.showPrivateOnly) {
            templates = templates.filter(t => !t.isPreset);
        }

        return templates;
    },

    renderTemplates() {
        const list = document.getElementById('template-list');
        if (!list) return;

        list.innerHTML = '';

        const templates = this.getFilteredTemplates();

        if (templates.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'template-empty';
            empty.innerHTML = `
                <div class="empty-icon">🏠</div>
                <div class="empty-text">暂无模板</div>
                <div class="empty-hint">调整筛选条件或保存您的方案为模板</div>
            `;
            list.appendChild(empty);
            return;
        }

        templates.forEach(template => {
            const card = this.createTemplateCard(template);
            list.appendChild(card);
        });
    },

    createTemplateCard(template) {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.dataset.templateId = template.id;

        const thumb = document.createElement('div');
        thumb.className = 'template-thumb';
        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 160;
        thumbCanvas.height = 120;
        this.drawTemplateThumbnail(thumbCanvas, template);
        thumb.appendChild(thumbCanvas);

        if (!template.isPreset) {
            const badge = document.createElement('div');
            badge.className = 'template-badge private';
            badge.textContent = '私有';
            thumb.appendChild(badge);
        } else {
            const badge = document.createElement('div');
            badge.className = 'template-badge preset';
            badge.textContent = '预设';
            thumb.appendChild(badge);
        }

        const info = document.createElement('div');
        info.className = 'template-info';

        const name = document.createElement('div');
        name.className = 'template-name';
        name.textContent = template.name;
        info.appendChild(name);

        const desc = document.createElement('div');
        desc.className = 'template-desc';
        desc.textContent = template.description;
        info.appendChild(desc);

        const stats = document.createElement('div');
        stats.className = 'template-stats';

        const areaStat = document.createElement('span');
        areaStat.className = 'template-stat';
        areaStat.innerHTML = `<span class="stat-icon">📐</span> ${template.area}㎡`;
        stats.appendChild(areaStat);

        const roomStat = document.createElement('span');
        roomStat.className = 'template-stat';
        roomStat.innerHTML = `<span class="stat-icon">🚪</span> ${template.roomCount}室`;
        stats.appendChild(roomStat);

        const catStat = document.createElement('span');
        catStat.className = 'template-stat category';
        catStat.textContent = template.category;
        stats.appendChild(catStat);

        info.appendChild(stats);

        const actions = document.createElement('div');
        actions.className = 'template-actions';

        const useBtn = document.createElement('button');
        useBtn.className = 'template-use-btn';
        useBtn.textContent = '使用模板';
        useBtn.addEventListener('click', () => {
            this.loadTemplate(template);
        });
        actions.appendChild(useBtn);

        if (!template.isPreset) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'template-delete-btn';
            deleteBtn.innerHTML = '🗑️';
            deleteBtn.title = '删除模板';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTemplate(template);
            });
            actions.appendChild(deleteBtn);
        }

        card.appendChild(thumb);
        card.appendChild(info);
        card.appendChild(actions);

        card.addEventListener('click', () => {
            this.loadTemplate(template);
        });

        return card;
    },

    drawTemplateThumbnail(canvas, template) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const padding = 8;

        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(0, 0, w, h);

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        const getBounds = (obj) => {
            if (obj.type === 'wall') {
                minX = Math.min(minX, obj.x1, obj.x2);
                minY = Math.min(minY, obj.y1, obj.y2);
                maxX = Math.max(maxX, obj.x1, obj.x2);
                maxY = Math.max(maxY, obj.y1, obj.y2);
            } else if (obj.type === 'furniture') {
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

        template.objects.forEach(getBounds);

        if (minX === Infinity) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = '14px DM Sans, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('空模板', w / 2, h / 2);
            return;
        }

        const boundsW = maxX - minX;
        const boundsH = maxY - minY;
        const scale = Math.min((w - padding * 2) / boundsW, (h - padding * 2) / boundsH);
        const offsetX = (w - boundsW * scale) / 2 - minX * scale;
        const offsetY = (h - boundsH * scale) / 2 - minY * scale;

        template.objects.forEach(obj => {
            if (obj.type === 'wall') {
                const x1 = obj.x1 * scale + offsetX;
                const y1 = obj.y1 * scale + offsetY;
                const x2 = obj.x2 * scale + offsetX;
                const y2 = obj.y2 * scale + offsetY;

                ctx.strokeStyle = '#333333';
                ctx.lineWidth = Math.max(1.5, obj.thickness * scale * 0.5);
                ctx.lineCap = 'square';
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            } else if (obj.type === 'furniture') {
                ctx.save();
                const x = obj.x * scale + offsetX;
                const y = obj.y * scale + offsetY;
                const fw = obj.width * scale;
                const fh = obj.height * scale;

                ctx.translate(x, y);
                ctx.rotate(obj.rotation || 0);

                ctx.fillStyle = obj.color || '#a8d8ea';
                ctx.strokeStyle = '#6b7280';
                ctx.lineWidth = 0.5;

                ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
                ctx.strokeRect(-fw / 2, -fh / 2, fw, fh);

                ctx.restore();
            }
        });
    },

    loadTemplate(template) {
        if (confirm(`确定要使用模板"${template.name}"吗？当前画布内容将被替换。`)) {
            Store.loadTemplateToCanvas(template);
            this.hidePanel();

            setTimeout(() => {
                if (window.App && App.zoomToFit) {
                    App.zoomToFit();
                }
            }, 50);

            if (window.CommandManager) {
                CommandManager.undoStack = [];
                CommandManager.redoStack = [];
            }
        }
    },

    deleteTemplate(template) {
        if (confirm(`确定要删除模板"${template.name}"吗？此操作不可撤销。`)) {
            Store.removeTemplate(template.id);
            this.renderTemplates();
        }
    },

    showSaveTemplateDialog() {
        if (Store.objects.length === 0) {
            alert('当前画布为空，无法保存为模板');
            return;
        }

        const modal = document.getElementById('save-template-modal');
        if (!modal) {
            this.createSaveTemplateModal();
            return;
        }
        modal.style.display = 'flex';

        const nameInput = document.getElementById('save-template-name');
        if (nameInput) {
            nameInput.value = '我的户型';
            nameInput.focus();
            nameInput.select();
        }
    },

    createSaveTemplateModal() {
        const overlay = document.createElement('div');
        overlay.id = 'save-template-modal';
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content save-template-modal">
                <div class="modal-header">
                    <h3>保存为模板</h3>
                    <button class="modal-close" id="save-template-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>模板名称</label>
                        <input type="text" id="save-template-name" placeholder="请输入模板名称" maxlength="20">
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select id="save-template-category">
                            ${TemplateLibrary.categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>描述</label>
                        <textarea id="save-template-desc" placeholder="请输入模板描述（选填）" maxlength="50" rows="2"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="modal-btn cancel" id="save-template-cancel">取消</button>
                    <button class="modal-btn confirm" id="save-template-confirm">保存</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeBtn = overlay.querySelector('#save-template-close');
        const cancelBtn = overlay.querySelector('#save-template-cancel');
        const confirmBtn = overlay.querySelector('#save-template-confirm');

        const closeModal = () => {
            overlay.style.display = 'none';
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        confirmBtn.addEventListener('click', () => {
            const name = document.getElementById('save-template-name').value.trim();
            const category = document.getElementById('save-template-category').value;
            const description = document.getElementById('save-template-desc').value.trim();

            if (!name) {
                alert('请输入模板名称');
                return;
            }

            const template = Store.saveCurrentAsTemplate(name, category, description || '我的自定义模板');
            Store.addTemplate(template);

            this.renderTemplates();
            closeModal();
            alert('模板保存成功！');
        });

        overlay.style.display = 'flex';
        const nameInput = document.getElementById('save-template-name');
        if (nameInput) {
            nameInput.value = '我的户型';
            nameInput.focus();
            nameInput.select();
        }
    },

    showPanel() {
        const panel = document.getElementById('template-library-panel');
        if (panel) {
            panel.classList.add('visible');
        }
    },

    hidePanel() {
        const panel = document.getElementById('template-library-panel');
        if (panel) {
            panel.classList.remove('visible');
        }
    },

    togglePanel() {
        const panel = document.getElementById('template-library-panel');
        if (panel) {
            if (panel.classList.contains('visible')) {
                this.hidePanel();
            } else {
                this.showPanel();
            }
        }
    },

    refresh() {
        this.renderTemplates();
    }
};

window.TemplateLibraryUI = TemplateLibraryUI;
