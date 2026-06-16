const TextTool = {
    pendingPosition: null,

    handleMouseDown(e) {
        const rect = e.target.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const world = Coordinates.screenToWorld(screenX, screenY);

        const snapped = Snap.snapPointToGrid(world.x, world.y, Store.canvas.gridSize);
        this.pendingPosition = { x: snapped.x, y: snapped.y };

        this.showTextModal();
    },

    showTextModal() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const modal = document.createElement('div');
        modal.className = 'text-input-modal';

        const title = document.createElement('h4');
        title.textContent = '输入文字';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = '请输入文字内容...';
        input.maxLength = 20;

        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn cancel';
        cancelBtn.textContent = '取消';

        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-btn confirm';
        confirmBtn.textContent = '确定';

        actions.appendChild(cancelBtn);
        actions.appendChild(confirmBtn);

        modal.appendChild(title);
        modal.appendChild(input);
        modal.appendChild(actions);

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        setTimeout(() => input.focus(), 100);

        const closeModal = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(modal);
            this.pendingPosition = null;
        };

        const confirm = () => {
            const text = input.value.trim();
            if (text && this.pendingPosition) {
                const textObj = {
                    id: Store.generateId('text'),
                    type: 'text',
                    x: this.pendingPosition.x,
                    y: this.pendingPosition.y,
                    content: text,
                    fontSize: 16,
                    width: text.length * 12,
                    height: 20,
                    rotation: 0,
                    createdAt: Date.now()
                };
                CommandManager.execute(new CreateObjectCommand(textObj));
                Store.selectObject(textObj.id, 'text');
            }
            closeModal();
        };

        cancelBtn.addEventListener('click', closeModal);
        confirmBtn.addEventListener('click', confirm);
        overlay.addEventListener('click', closeModal);

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                confirm();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
    },

    handleMouseMove(e) {
    },

    handleMouseUp(e) {
    }
};
