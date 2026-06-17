const UIRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-ui');
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

        if (Store.selection.objectIds && Store.selection.objectIds.length > 0) {
            Store.selection.objectIds.forEach((id, index) => {
                const obj = Store.getObject(id);
                if (obj) {
                    const isPrimary = index === Store.selection.objectIds.length - 1;
                    if (obj.type === 'furniture' || obj.type === 'text') {
                        this.drawSelectionBox(ctx, obj, isPrimary);
                    } else if (obj.type === 'wall') {
                        this.drawWallSelection(ctx, obj, isPrimary);
                    } else if (obj.type === 'dimension') {
                        this.drawDimensionSelection(ctx, obj, isPrimary);
                    } else if (obj.type === 'group') {
                        this.drawGroupSelection(ctx, obj, isPrimary);
                    }
                }
            });

            const primaryObj = Store.getObject(Store.selection.objectId);
            if (primaryObj && Store.selection.objectIds.length === 1) {
                if (primaryObj.type === 'furniture' || primaryObj.type === 'text' || primaryObj.type === 'group') {
                    this.drawResizeHandles(ctx, primaryObj);
                }
            }
        }

        if (SelectTool && SelectTool.marqueeStart && SelectTool.marqueeEnd) {
            this.drawMarquee(ctx);
        }

        if (Store.groupEditPath && Store.groupEditPath.length > 0) {
            this.drawGroupEditIndicator(ctx);
        }
    },

    drawSelectionBox(ctx, obj, isPrimary) {
        const color = isPrimary ? '#3b82f6' : '#93c5fd';
        if (obj.type === 'furniture' || obj.type === 'text') {
            const corners = Coordinates.getObjectCorners(obj);
            const scale = Store.canvas.scale;

            if (corners.length !== 4) return;

            const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);

            ctx.beginPath();
            ctx.moveTo(screenCorners[0].x, screenCorners[0].y);
            for (let i = 1; i < 4; i++) {
                ctx.lineTo(screenCorners[i].x, screenCorners[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
        }
    },

    drawResizeHandles(ctx, obj) {
        const corners = Coordinates.getObjectCorners(obj);
        const scale = Store.canvas.scale;

        if (corners.length !== 4) return;

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

        const edges = [
            { x: (screenCorners[0].x + screenCorners[1].x) / 2, y: (screenCorners[0].y + screenCorners[1].y) / 2 },
            { x: screenCorners[1].x, y: screenCorners[1].y },
            { x: (screenCorners[1].x + screenCorners[2].x) / 2, y: (screenCorners[1].y + screenCorners[2].y) / 2 },
            { x: screenCorners[2].x, y: screenCorners[2].y },
            { x: (screenCorners[2].x + screenCorners[3].x) / 2, y: (screenCorners[2].y + screenCorners[3].y) / 2 },
            { x: screenCorners[3].x, y: screenCorners[3].y },
            { x: (screenCorners[3].x + screenCorners[0].x) / 2, y: (screenCorners[3].y + screenCorners[0].y) / 2 },
            { x: screenCorners[0].x, y: screenCorners[0].y }
        ];

        const handleSize = 8 * scale;

        edges.forEach((pos, i) => {
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.roundRect(
                pos.x - handleSize / 2,
                pos.y - handleSize / 2,
                handleSize,
                handleSize,
                2 * scale
            );
            ctx.fill();
            ctx.stroke();
        });

        if (obj.type !== 'group') {
            const rotateHandleSize = 10 * scale;
            const centerScreen = Coordinates.worldToScreen(obj.x, obj.y);
            const handleY = centerScreen.y - Coordinates.worldDistanceToScreen(obj.height / 2 + 30);

            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(centerScreen.x, centerScreen.y - Coordinates.worldDistanceToScreen(obj.height / 2));
            ctx.lineTo(centerScreen.x, handleY - rotateHandleSize);
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerScreen.x, handleY, rotateHandleSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(centerScreen.x, handleY, rotateHandleSize * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawGroupSelection(ctx, group, isPrimary) {
        const corners = Coordinates.getObjectCorners(group);
        const scale = Store.canvas.scale;

        if (corners.length !== 4) return;

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));
        const color = isPrimary ? '#8b5cf6' : '#c4b5fd';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);

        ctx.beginPath();
        ctx.moveTo(screenCorners[0].x, screenCorners[0].y);
        for (let i = 1; i < 4; i++) {
            ctx.lineTo(screenCorners[i].x, screenCorners[i].y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        const centerScreen = Coordinates.worldToScreen(group.x, group.y);
        const labelWidth = 60 * scale;
        const labelHeight = 20 * scale;
        const labelY = screenCorners[0].y - labelHeight - 4;

        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.roundRect(
            centerScreen.x - labelWidth / 2,
            labelY,
            labelWidth,
            labelHeight,
            4 * scale
        );
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = `${11 * scale}px DM Sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('组合', centerScreen.x, labelY + labelHeight / 2);
    },

    drawWallSelection(ctx, wall, isPrimary = true) {
        const start = Coordinates.worldToScreen(wall.x1, wall.y1);
        const end = Coordinates.worldToScreen(wall.x2, wall.y2);
        const thickness = Coordinates.worldDistanceToScreen(wall.thickness);
        const scale = Store.canvas.scale;
        const color = isPrimary ? '#3b82f6' : '#93c5fd';

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) return;

        const nx = -dy / len * thickness / 2;
        const ny = dx / len * thickness / 2;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(start.x + nx, start.y + ny);
        ctx.lineTo(end.x + nx, end.y + ny);
        ctx.lineTo(end.x - nx, end.y - ny);
        ctx.lineTo(start.x - nx, start.y - ny);
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);

        if (isPrimary) {
            const handleSize = 10 * scale;
            const endpoints = [
                { pos: start, connection: wall.startConnection, key: 'start' },
                { pos: end, connection: wall.endConnection, key: 'end' }
            ];

            endpoints.forEach(ep => {
                let handleColor = '#3b82f6';
                let innerColor = '#ffffff';

                if (typeof WallConnection !== 'undefined' && ep.connection) {
                    if (ep.connection.type === 'endpoint') {
                        handleColor = '#22c55e';
                    } else if (ep.connection.type === 't-junction') {
                        handleColor = '#f59e0b';
                    }
                }

                ctx.fillStyle = innerColor;
                ctx.strokeStyle = handleColor;
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.roundRect(
                    ep.pos.x - handleSize / 2,
                    ep.pos.y - handleSize / 2,
                    handleSize,
                    handleSize,
                    2 * scale
                );
                ctx.fill();
                ctx.stroke();

                if (typeof WallConnection !== 'undefined' && ep.connection) {
                    const dotSize = 4 * scale;
                    ctx.fillStyle = handleColor;
                    ctx.beginPath();
                    ctx.arc(ep.pos.x, ep.pos.y, dotSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            });

            if (typeof WallConnection !== 'undefined') {
                this.drawWallConnectionLabels(ctx, wall, scale);
            }
        }
    },

    drawWallConnectionLabels(ctx, wall, scale) {
        const midpoint = {
            x: (wall.x1 + wall.x2) / 2,
            y: (wall.y1 + wall.y2) / 2
        };
        const screenMid = Coordinates.worldToScreen(midpoint.x, midpoint.y);

        const connections = [];
        if (wall.startConnection) {
            connections.push('起点:' + (wall.startConnection.type === 'endpoint' ? '端点连接' : 'T型连接'));
        }
        if (wall.endConnection) {
            connections.push('终点:' + (wall.endConnection.type === 'endpoint' ? '端点连接' : 'T型连接'));
        }

        if (connections.length > 0) {
            const labelText = connections.join(' | ');
            const fontSize = 11 * scale;
            ctx.font = `${fontSize}px DM Sans`;
            const textWidth = ctx.measureText(labelText).width;
            const padding = 6 * scale;
            const labelY = screenMid.y - 20 * scale;

            ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
            ctx.beginPath();
            ctx.roundRect(
                screenMid.x - textWidth / 2 - padding,
                labelY - fontSize / 2 - padding / 2,
                textWidth + padding * 2,
                fontSize + padding,
                4 * scale
            );
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, screenMid.x, labelY);
        }
    },

    drawDimensionSelection(ctx, dim, isPrimary = true) {
        const start = Coordinates.worldToScreen(dim.x1, dim.y1);
        const end = Coordinates.worldToScreen(dim.x2, dim.y2);
        const scale = Store.canvas.scale;
        const color = isPrimary ? '#3b82f6' : '#93c5fd';

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isPrimary) {
            const handleSize = 8 * scale;
            const endpoints = [start, end];

            endpoints.forEach(pos => {
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;

                ctx.beginPath();
                ctx.roundRect(
                    pos.x - handleSize / 2,
                    pos.y - handleSize / 2,
                    handleSize,
                    handleSize,
                    2 * scale
                );
                ctx.fill();
                ctx.stroke();
            });
        }
    },

    drawMarquee(ctx) {
        const start = SelectTool.marqueeStart;
        const end = SelectTool.marqueeEnd;

        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);

        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);

        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.fill();
        ctx.stroke();
        ctx.setLineDash([]);
    },

    drawGroupEditIndicator(ctx) {
        const scale = Store.canvas.scale;
        const currentGroup = Store.getCurrentGroup();
        
        if (currentGroup) {
            const bounds = Store.getGroupBounds(currentGroup);
            if (bounds) {
                const padding = 20;
                const minX = bounds.minX - padding;
                const minY = bounds.minY - padding;
                const maxX = bounds.maxX + padding;
                const maxY = bounds.maxY + padding;

                const screenMin = Coordinates.worldToScreen(minX, minY);
                const screenMax = Coordinates.worldToScreen(maxX, maxY);

                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.setLineDash([10, 5]);
                ctx.strokeRect(
                    screenMin.x, screenMin.y,
                    screenMax.x - screenMin.x, screenMax.y - screenMin.y
                );
                ctx.setLineDash([]);
            }
        }

        const breadcrumbY = 60;
        ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
        ctx.beginPath();
        ctx.roundRect(20, breadcrumbY - 18, 200, 28, 6);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '13px DM Sans';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        let text = '编辑中: ';
        if (Store.groupEditPath.length > 0) {
            text += Store.groupEditPath.map((_, i) => `组合${i + 1}`).join(' / ');
        }
        ctx.fillText(text, 30, breadcrumbY - 4);

        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.font = '11px DM Sans';
        ctx.fillText('按 Esc 退出', 30, breadcrumbY + 8);
    }
};
