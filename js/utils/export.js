const ExportUtils = {
    exportToPNG() {
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');

        const padding = 100;
        const bounds = this.calculateBounds();

        const worldWidth = bounds.maxX - bounds.minX + padding * 2;
        const worldHeight = bounds.maxY - bounds.minY + padding * 2;

        const scale = 2;
        tempCanvas.width = worldWidth * scale;
        tempCanvas.height = worldHeight * scale;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        ctx.save();
        ctx.scale(scale, scale);
        ctx.translate(-bounds.minX + padding, -bounds.minY + padding);

        this.drawGridForExport(ctx, bounds);
        this.drawWallsForExport(ctx);
        this.drawFurnitureForExport(ctx);
        this.drawAnnotationsForExport(ctx);

        ctx.restore();

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `floor-plan-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
    },

    calculateBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        Store.objects.forEach(obj => {
            if (obj.type === 'furniture' || obj.type === 'text') {
                const corners = Coordinates.getObjectCorners(obj);
                corners.forEach(c => {
                    minX = Math.min(minX, c.x);
                    minY = Math.min(minY, c.y);
                    maxX = Math.max(maxX, c.x);
                    maxY = Math.max(maxY, c.y);
                });
            } else if (obj.type === 'wall' || obj.type === 'dimension') {
                minX = Math.min(minX, obj.x1, obj.x2);
                minY = Math.min(minY, obj.y1, obj.y2);
                maxX = Math.max(maxX, obj.x1, obj.x2);
                maxY = Math.max(maxY, obj.y1, obj.y2);
            }
        });

        if (minX === Infinity) {
            minX = -200;
            minY = -200;
            maxX = 200;
            maxY = 200;
        }

        return { minX, minY, maxX, maxY };
    },

    drawGridForExport(ctx, bounds) {
        const gridSize = Store.canvas.gridSize;
        const startX = Math.floor(bounds.minX / gridSize) * gridSize;
        const startY = Math.floor(bounds.minY / gridSize) * gridSize;
        const endX = Math.ceil(bounds.maxX / gridSize) * gridSize;
        const endY = Math.ceil(bounds.maxY / gridSize) * gridSize;

        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 0.5;

        for (let x = startX; x <= endX; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, bounds.minY);
            ctx.lineTo(x, bounds.maxY);
            ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(bounds.minX, y);
            ctx.lineTo(bounds.maxX, y);
            ctx.stroke();
        }

        ctx.strokeStyle = '#c0c0c0';
        ctx.lineWidth = 1;

        for (let x = startX; x <= endX; x += gridSize * 5) {
            ctx.beginPath();
            ctx.moveTo(x, bounds.minY);
            ctx.lineTo(x, bounds.maxY);
            ctx.stroke();
        }

        for (let y = startY; y <= endY; y += gridSize * 5) {
            ctx.beginPath();
            ctx.moveTo(bounds.minX, y);
            ctx.lineTo(bounds.maxX, y);
            ctx.stroke();
        }
    },

    drawWallsForExport(ctx) {
        Store.objects.forEach(obj => {
            if (obj.type === 'wall') {
                const dx = obj.x2 - obj.x1;
                const dy = obj.y2 - obj.y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / len * obj.thickness / 2;
                const ny = dx / len * obj.thickness / 2;

                const points = [
                    { x: obj.x1 + nx, y: obj.y1 + ny },
                    { x: obj.x2 + nx, y: obj.y2 + ny },
                    { x: obj.x2 - nx, y: obj.y2 - ny },
                    { x: obj.x1 - nx, y: obj.y1 - ny }
                ];

                if (obj.materialId && typeof MaterialRenderer !== 'undefined' && typeof MaterialLibrary !== 'undefined') {
                    const material = MaterialLibrary.getMaterialById(obj.materialId);
                    if (material) {
                        this.drawMaterialFill(ctx, points, material, {
                            scale: obj.materialScale || 1,
                            rotation: obj.materialRotation || 0,
                            opacity: obj.materialOpacity !== undefined ? obj.materialOpacity : 1
                        });
                    } else {
                        ctx.fillStyle = '#333333';
                        ctx.beginPath();
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) {
                            ctx.lineTo(points[i].x, points[i].y);
                        }
                        ctx.closePath();
                        ctx.fill();
                    }
                } else {
                    ctx.fillStyle = '#333333';
                    ctx.beginPath();
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) {
                        ctx.lineTo(points[i].x, points[i].y);
                    }
                    ctx.closePath();
                    ctx.fill();
                }

                ctx.strokeStyle = '#1a1a1a';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x, points[i].y);
                }
                ctx.closePath();
                ctx.stroke();
            }
        });
    },

    drawFurnitureForExport(ctx) {
        Store.objects.forEach(obj => {
            if (obj.type === 'furniture') {
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.rotation || 0);

                if (obj.materialId && typeof MaterialRenderer !== 'undefined' && typeof MaterialLibrary !== 'undefined') {
                    const material = MaterialLibrary.getMaterialById(obj.materialId);
                    if (material) {
                        const rect = {
                            x: -obj.width / 2,
                            y: -obj.height / 2,
                            width: obj.width,
                            height: obj.height
                        };
                        this.drawMaterialFillRect(ctx, rect, material, {
                            scale: obj.materialScale || 1,
                            rotation: obj.materialRotation || 0,
                            opacity: obj.materialOpacity !== undefined ? obj.materialOpacity : 1
                        });
                    } else {
                        ctx.fillStyle = obj.color + 'cc';
                        ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
                    }
                } else {
                    ctx.fillStyle = obj.color + 'cc';
                    ctx.fillRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);
                }

                ctx.strokeStyle = '#374151';
                ctx.lineWidth = 1;
                ctx.strokeRect(-obj.width / 2, -obj.height / 2, obj.width, obj.height);

                ctx.fillStyle = '#374151';
                ctx.font = '16px DM Sans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                const iconChar = this.getFurnitureIcon(obj.icon);
                ctx.fillText(iconChar, 0, 0);

                ctx.restore();
            }
        });
    },

    drawMaterialFill(ctx, points, material, options) {
        const { scale = 1, rotation = 0, opacity = 1 } = options;
        const textureScale = scale * (material.defaultScale || 50);

        if (textureScale <= 0) return;

        const textureCanvas = MaterialLibrary.generateTextureCanvas(material, 256);
        if (!textureCanvas) return;

        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = 256;
        rotatedCanvas.height = 256;
        const rctx = rotatedCanvas.getContext('2d');

        if (rotation !== 0) {
            rctx.save();
            rctx.translate(128, 128);
            rctx.rotate(rotation * Math.PI / 180);
            rctx.drawImage(textureCanvas, -128, -128, 256, 256);
            rctx.restore();
        } else {
            rctx.drawImage(textureCanvas, 0, 0);
        }

        ctx.save();

        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        const pattern = ctx.createPattern(rotatedCanvas, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    },

    drawMaterialFillRect(ctx, rect, material, options) {
        const { scale = 1, rotation = 0, opacity = 1 } = options;
        const textureScale = scale * (material.defaultScale || 50);

        if (textureScale <= 0) return;

        const textureCanvas = MaterialLibrary.generateTextureCanvas(material, 256);
        if (!textureCanvas) return;

        const rotatedCanvas = document.createElement('canvas');
        rotatedCanvas.width = 256;
        rotatedCanvas.height = 256;
        const rctx = rotatedCanvas.getContext('2d');

        if (rotation !== 0) {
            rctx.save();
            rctx.translate(128, 128);
            rctx.rotate(rotation * Math.PI / 180);
            rctx.drawImage(textureCanvas, -128, -128, 256, 256);
            rctx.restore();
        } else {
            rctx.drawImage(textureCanvas, 0, 0);
        }

        ctx.save();

        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        const pattern = ctx.createPattern(rotatedCanvas, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
        }

        ctx.restore();
    },

    drawAnnotationsForExport(ctx) {
        Store.objects.forEach(obj => {
            if (obj.type === 'dimension') {
                const dx = obj.x2 - obj.x1;
                const dy = obj.y2 - obj.y1;
                const len = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy / len * 8;
                const ny = dx / len * 8;

                ctx.strokeStyle = '#ef4444';
                ctx.fillStyle = '#ef4444';
                ctx.lineWidth = 1;

                ctx.beginPath();
                ctx.moveTo(obj.x1, obj.y1);
                ctx.lineTo(obj.x2, obj.y2);
                ctx.stroke();

                this.drawArrowForExport(ctx, obj.x1, obj.y1, obj.x1 - dx * 0.02, obj.y1 - dy * 0.02);
                this.drawArrowForExport(ctx, obj.x2, obj.y2, obj.x2 + dx * 0.02, obj.y2 + dy * 0.02);

                const midX = (obj.x1 + obj.x2) / 2;
                const midY = (obj.y1 + obj.y2) / 2;
                const text = (len / 100).toFixed(2) + 'm';

                ctx.font = '14px DM Mono';
                const textWidth = ctx.measureText(text).width;

                ctx.fillStyle = '#ffffff';
                ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20);

                ctx.fillStyle = '#374151';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(text, midX, midY);
            } else if (obj.type === 'text') {
                ctx.save();
                ctx.translate(obj.x, obj.y);
                ctx.rotate(obj.rotation || 0);

                ctx.fillStyle = '#1f2937';
                ctx.font = `${obj.fontSize}px DM Sans`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(obj.content, 0, 0);

                ctx.restore();
            }
        });
    },

    drawArrowForExport(ctx, x, y, tx, ty) {
        const dx = x - tx;
        const dy = y - ty;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len * 6;
        const ny = dx / len * 6;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * 0.3 + nx, y + dy * 0.3 + ny);
        ctx.lineTo(x + dx * 0.3 - nx, y + dy * 0.3 - ny);
        ctx.closePath();
        ctx.fill();
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
    }
};
