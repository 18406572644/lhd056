const WallRenderer = {
    ctx: null,
    canvas: null,

    init() {
        this.canvas = document.getElementById('canvas-walls');
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

        const drawWalls = (objects) => {
            const walls = [];
            const collectWalls = (objs) => {
                objs.forEach(obj => {
                    if (obj.type === 'wall') {
                        walls.push(obj);
                    } else if (obj.type === 'group' && obj.children) {
                        collectWalls(obj.children);
                    }
                });
            };
            collectWalls(objects);

            const sortedWalls = this.sortWallsForRendering(walls);
            sortedWalls.forEach(wall => {
                this.drawWall(ctx, wall);
            });
        };

        drawWalls(Store.objects);

        if (!Store.previewObject || Store.previewObject.type !== 'wall') {
            this.drawCrossJunctionCaps(ctx);
        }

        if (Store.previewObject && Store.previewObject.type === 'wall') {
            this.drawWall(ctx, Store.previewObject, true);
            this.drawSnapIndicator(ctx, Store.previewObject);
        }

        if (Store.previewObject && Store.previewObject.type === 'room') {
            this.drawRoomPreview(ctx, Store.previewObject);
        }
    },

    sortWallsForRendering(walls) {
        const tJunctionWalls = [];
        const otherWalls = [];

        walls.forEach(wall => {
            const hasTJunction = (wall.startConnection && wall.startConnection.type === 't-junction') ||
                                (wall.endConnection && wall.endConnection.type === 't-junction');
            if (hasTJunction) {
                tJunctionWalls.push(wall);
            } else {
                otherWalls.push(wall);
            }
        });

        return [...otherWalls, ...tJunctionWalls];
    },

    drawCrossJunctionCaps(ctx) {
        if (typeof WallConnection === 'undefined') return;

        const intersections = WallConnection.findAllWallIntersections();
        const thickness = Coordinates.worldDistanceToScreen(12);

        intersections.forEach(intersection => {
            const screenPos = Coordinates.worldToScreen(intersection.x, intersection.y);

            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, thickness * 0.55, 0, Math.PI * 2);
            ctx.fill();
        });
    },

    drawWall(ctx, wall, isPreview = false) {
        const start = Coordinates.worldToScreen(wall.x1, wall.y1);
        const end = Coordinates.worldToScreen(wall.x2, wall.y2);
        const thickness = Coordinates.worldDistanceToScreen(wall.thickness);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return;

        const nx = -dy / len * thickness / 2;
        const ny = dx / len * thickness / 2;

        let startExt = 0;
        let endExt = 0;

        if (!isPreview && typeof WallConnection !== 'undefined') {
            if (wall.startConnection && wall.startConnection.type === 'endpoint') {
                startExt = thickness * 0.1;
            }
            if (wall.endConnection && wall.endConnection.type === 'endpoint') {
                endExt = thickness * 0.1;
            }
            if (wall.startConnection && wall.startConnection.type === 't-junction') {
                startExt = thickness * 0.5;
            }
            if (wall.endConnection && wall.endConnection.type === 't-junction') {
                endExt = thickness * 0.5;
            }
        }

        const dirX = dx / len;
        const dirY = dy / len;

        const sX = start.x - dirX * startExt;
        const sY = start.y - dirY * startExt;
        const eX = end.x + dirX * endExt;
        const eY = end.y + dirY * endExt;

        if (isPreview) {
            ctx.setLineDash([5, 5]);
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sX + nx, sY + ny);
            ctx.lineTo(eX + nx, eY + ny);
            ctx.lineTo(eX - nx, eY - ny);
            ctx.lineTo(sX - nx, sY - ny);
            ctx.closePath();
            ctx.stroke();
            ctx.setLineDash([]);
        } else {
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.moveTo(sX + nx, sY + ny);
            ctx.lineTo(eX + nx, eY + ny);
            ctx.lineTo(eX - nx, eY - ny);
            ctx.lineTo(sX - nx, sY - ny);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        if (!isPreview && typeof WallConnection !== 'undefined') {
            this.drawWallJunctionCaps(ctx, wall, thickness);
        }
    },

    drawWallJunctionCaps(ctx, wall, thickness) {
        const endpoints = [
            { x: wall.x1, y: wall.y1, conn: wall.startConnection, key: 'start' },
            { x: wall.x2, y: wall.y2, conn: wall.endConnection, key: 'end' }
        ];

        endpoints.forEach(ep => {
            if (!ep.conn) return;

            const screenPos = Coordinates.worldToScreen(ep.x, ep.y);

            if (ep.conn.type === 'endpoint') {
                const junctionType = WallConnection.getWallJunctionType(wall, ep.key);

                if (junctionType === 'corner') {
                } else if (junctionType === 't-junction' || junctionType === 'cross') {
                    ctx.fillStyle = '#333333';
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, thickness / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (ep.conn.type === 't-junction') {
                const otherWall = Store.getObject(ep.conn.wallId);
                if (otherWall) {
                    const oDx = otherWall.x2 - otherWall.x1;
                    const oDy = otherWall.y2 - otherWall.y1;
                    const oLen = Math.sqrt(oDx * oDx + oDy * oDy);
                    if (oLen > 0) {
                        const oNx = -oDy / oLen;
                        const oNy = oDx / oLen;
                        const halfThick = thickness / 2;

                        const jScreen = Coordinates.worldToScreen(ep.conn.pointX, ep.conn.pointY);
                        const offsetX = oNx * halfThick;
                        const offsetY = oNy * halfThick;

                        const wDx = wall.x2 - wall.x1;
                        const wDy = wall.y2 - wall.y1;
                        const wLen = Math.sqrt(wDx * wDx + wDy * wDy);
                        const extendDir = ep.key === 'start' ? -1 : 1;
                        const extendLen = thickness * 0.5;

                        ctx.fillStyle = '#333333';
                        ctx.beginPath();
                        ctx.moveTo(jScreen.x + offsetX, jScreen.y + offsetY);
                        ctx.lineTo(jScreen.x - offsetX, jScreen.y - offsetY);
                        ctx.lineTo(
                            jScreen.x - offsetX + (wDx / wLen) * extendDir * extendLen,
                            jScreen.y - offsetY + (wDy / wLen) * extendDir * extendLen
                        );
                        ctx.lineTo(
                            jScreen.x + offsetX + (wDx / wLen) * extendDir * extendLen,
                            jScreen.y + offsetY + (wDy / wLen) * extendDir * extendLen
                        );
                        ctx.closePath();
                        ctx.fill();
                    }
                }
            }
        });
    },

    drawSnapIndicator(ctx, wall) {
        if (!wall._startSnapped && !wall._endSnapped) return;

        const points = [];
        if (wall._startSnapped) {
            points.push({ x: wall.x1, y: wall.y1, type: wall._startSnapType });
        }
        if (wall._endSnapped) {
            points.push({ x: wall.x2, y: wall.y2, type: wall._endSnapType });
        }

        points.forEach(p => {
            const screenPos = Coordinates.worldToScreen(p.x, p.y);
            const size = 8 * Store.canvas.scale;

            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;

            if (p.type === 'endpoint') {
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, size, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (p.type === 'midpoint') {
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y - size);
                ctx.lineTo(screenPos.x + size, screenPos.y);
                ctx.lineTo(screenPos.x, screenPos.y + size);
                ctx.lineTo(screenPos.x - size, screenPos.y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.fillRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
                ctx.strokeRect(screenPos.x - size / 2, screenPos.y - size / 2, size, size);
            }
        });
    },

    drawRoomPreview(ctx, room) {
        const thickness = Coordinates.worldDistanceToScreen(12);

        const corners = [
            { x: room.x1, y: room.y1 },
            { x: room.x2, y: room.y1 },
            { x: room.x2, y: room.y2 },
            { x: room.x1, y: room.y2 }
        ];

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;

        for (let i = 0; i < 4; i++) {
            const start = screenCorners[i];
            const end = screenCorners[(i + 1) % 4];
            const dx = end.x - start.x;
            const dy = end.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) continue;

            const nx = -dy / len * thickness / 2;
            const ny = dx / len * thickness / 2;

            ctx.beginPath();
            ctx.moveTo(start.x + nx, start.y + ny);
            ctx.lineTo(end.x + nx, end.y + ny);
            ctx.lineTo(end.x - nx, end.y - ny);
            ctx.lineTo(start.x - nx, start.y - ny);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.setLineDash([]);
    }
};
