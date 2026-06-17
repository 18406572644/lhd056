const FurnitureRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-furniture');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
    },

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    render() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const drawObjects = (objects) => {
            objects.forEach(obj => {
                if (obj.type === 'furniture') {
                    this.drawFurniture(ctx, obj);
                } else if (obj.type === 'group' && obj.children) {
                    drawObjects(obj.children);
                }
            });
        };

        drawObjects(Store.objects);

        if (Store.dragState.tempObject && Store.dragState.tempObject.type === 'furniture') {
            this.drawFurniture(ctx, Store.dragState.tempObject, true);
        }
    },

    drawFurniture(ctx, furniture, isPreview = false) {
        const screenPos = Coordinates.worldToScreen(furniture.x, furniture.y);
        const screenWidth = Coordinates.worldDistanceToScreen(furniture.width);
        const screenHeight = Coordinates.worldDistanceToScreen(furniture.height);
        const scale = Store.canvas.scale;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(furniture.rotation || 0);

        if (isPreview) {
            ctx.globalAlpha = 0.6;
        }

        if (furniture.materialId && typeof MaterialRenderer !== 'undefined') {
            MaterialRenderer.drawFilledRect(
                ctx,
                -screenWidth / 2,
                -screenHeight / 2,
                screenWidth,
                screenHeight,
                furniture.materialId,
                {
                    scale: furniture.materialScale || 1,
                    rotation: furniture.materialRotation || 0,
                    opacity: furniture.materialOpacity !== undefined ? furniture.materialOpacity : 1
                }
            );
        } else {
            ctx.fillStyle = furniture.color + (isPreview ? '99' : 'cc');
            ctx.beginPath();
            ctx.roundRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight, 4 * scale);
            ctx.fill();
        }

        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight, 4 * scale);
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.font = `${16 * scale}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iconChar = this.getFurnitureIcon(furniture.icon);
        ctx.fillText(iconChar, 0, 0);

        ctx.restore();
    },

    getFurnitureIcon(icon) {
        const icons = {
            sofa: '🛋️',
            table: '🪑',
            tv: '📺',
            bookshelf: '📚',
            bed: '🛏️',
            wardrobe: '🚪',
            nightstand: '🗄️',
            desk: '🖥️',
            fridge: '🧊',
            stove: '🍳',
            sink: '🚿',
            toilet: '🚽',
            bathtub: '🛁',
            shower: '🚿'
        };
        return icons[icon] || '📦';
    },

    drawThumbnail(canvas, furniture) {
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const padding = size * 0.1;

        ctx.clearRect(0, 0, size, size);

        const scale = (size - padding * 2) / Math.max(furniture.width, furniture.height);
        const drawWidth = furniture.width * scale;
        const drawHeight = furniture.height * scale;
        const offsetX = (size - drawWidth) / 2;
        const offsetY = (size - drawHeight) / 2;

        ctx.fillStyle = furniture.color + 'cc';
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(offsetX, offsetY, drawWidth, drawHeight, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.font = `${size * 0.35}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const iconChar = this.getFurnitureIcon(furniture.icon);
        ctx.fillText(iconChar, size / 2, size / 2);
    }
};
