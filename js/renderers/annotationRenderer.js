const AnnotationRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-annotations');
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

        Store.objects.forEach(obj => {
            if (obj.type === 'dimension') {
                this.drawDimension(ctx, obj);
            } else if (obj.type === 'text') {
                this.drawText(ctx, obj);
            }
        });

        if (Store.dimensionStart && Store.previewObject && Store.previewObject.type === 'dimension') {
            this.drawDimension(ctx, Store.previewObject, true);
        }
    },

    drawDimension(ctx, dim, isPreview = false) {
        const start = Coordinates.worldToScreen(dim.x1, dim.y1);
        const end = Coordinates.worldToScreen(dim.x2, dim.y2);
        const scale = Store.canvas.scale;

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return;

        const offsetDist = 8 * scale;
        const nx = -dy / len * offsetDist;
        const ny = dx / len * offsetDist;

        const lineStart = { x: start.x + nx, y: start.y + ny };
        const lineEnd = { x: end.x + nx, y: end.y + ny };

        ctx.strokeStyle = '#ef4444';
        ctx.fillStyle = '#ef4444';
        ctx.lineWidth = isPreview ? 1.5 : 1.5;
        ctx.globalAlpha = isPreview ? 0.7 : 1;

        ctx.beginPath();
        ctx.moveTo(lineStart.x, lineStart.y);
        ctx.lineTo(lineEnd.x, lineEnd.y);
        ctx.stroke();

        this.drawArrow(ctx, lineStart.x, lineStart.y, start.x, start.y, scale);
        this.drawArrow(ctx, lineEnd.x, lineEnd.y, end.x, end.y, scale);

        const midX = (lineStart.x + lineEnd.x) / 2;
        const midY = (lineStart.y + lineEnd.y) / 2;

        const worldLen = Math.sqrt(
            Math.pow(dim.x2 - dim.x1, 2) + Math.pow(dim.y2 - dim.y1, 2)
        );
        const text = Coordinates.formatDimension(worldLen);

        ctx.font = `${13 * scale}px DM Mono`;
        const textWidth = ctx.measureText(text).width;
        const textHeight = 16 * scale;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(
            midX - textWidth / 2 - 6 * scale,
            midY - textHeight / 2,
            textWidth + 12 * scale,
            textHeight,
            4 * scale
        );
        ctx.fill();

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#374151';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, midX, midY + 1);

        ctx.globalAlpha = 1;
    },

    drawArrow(ctx, x, y, tx, ty, scale) {
        const dx = x - tx;
        const dy = y - ty;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const arrowSize = 8 * scale;
        const nx = -dy / len * arrowSize * 0.4;
        const ny = dx / len * arrowSize * 0.4;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * 0.3 + nx, y + dy * 0.3 + ny);
        ctx.lineTo(x + dx * 0.3 - nx, y + dy * 0.3 - ny);
        ctx.closePath();
        ctx.fill();
    },

    drawText(ctx, textObj) {
        const screenPos = Coordinates.worldToScreen(textObj.x, textObj.y);
        const scale = Store.canvas.scale;

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(textObj.rotation || 0);

        ctx.fillStyle = '#1f2937';
        ctx.font = `${textObj.fontSize * scale}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(textObj.content, 0, 0);

        ctx.restore();
    }
};
