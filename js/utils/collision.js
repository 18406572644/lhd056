const Collision = {
    pointInRect(px, py, rect) {
        const cos = Math.cos(-rect.rotation || 0);
        const sin = Math.sin(-rect.rotation || 0);
        const localX = (px - rect.x) * cos - (py - rect.y) * sin;
        const localY = (px - rect.x) * sin + (py - rect.y) * cos;

        return Math.abs(localX) <= rect.width / 2 &&
               Math.abs(localY) <= rect.height / 2;
    },

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) { xx = x1; yy = y1; }
        else if (param > 1) { xx = x2; yy = y2; }
        else { xx = x1 + param * C; yy = y1 + param * D; }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    },

    pointNearWall(px, py, wall, threshold = 15) {
        const dist = this.pointToLineDistance(px, py, wall.x1, wall.y1, wall.x2, wall.y2);
        return dist <= threshold;
    },

    findObjectAtPoint(x, y) {
        const objects = Store.getCurrentObjects();
        for (let i = objects.length - 1; i >= 0; i--) {
            const obj = objects[i];
            if (this.hitTestObject(x, y, obj)) {
                return obj;
            }
        }
        return null;
    },

    hitTestObject(x, y, obj) {
        if (obj.type === 'group') {
            if (obj.width && obj.height) {
                return this.pointInRect(x, y, obj);
            }
            if (obj.children) {
                for (let i = obj.children.length - 1; i >= 0; i--) {
                    if (this.hitTestObject(x, y, obj.children[i])) {
                        return true;
                    }
                }
            }
            return false;
        }
        if (obj.type === 'furniture' || obj.type === 'text') {
            return this.pointInRect(x, y, obj);
        } else if (obj.type === 'wall') {
            return this.pointNearWall(x, y, obj);
        } else if (obj.type === 'dimension') {
            return this.pointNearWall(x, y, obj, 10);
        }
        return false;
    },

    findObjectsInRect(x1, y1, x2, y2) {
        const results = [];
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        const objects = Store.getCurrentObjects();

        const testObject = (obj) => {
            if (obj.type === 'furniture' || obj.type === 'text') {
                const corners = Coordinates.getObjectCorners(obj);
                return corners.some(c => 
                    c.x >= minX && c.x <= maxX && c.y >= minY && c.y <= maxY
                );
            } else if (obj.type === 'wall' || obj.type === 'dimension') {
                const inRange1 = obj.x1 >= minX && obj.x1 <= maxX && obj.y1 >= minY && obj.y1 <= maxY;
                const inRange2 = obj.x2 >= minX && obj.x2 <= maxX && obj.y2 >= minY && obj.y2 <= maxY;
                return inRange1 || inRange2;
            } else if (obj.type === 'group') {
                if (obj.x && obj.y && obj.width && obj.height) {
                    const hw = obj.width / 2;
                    const hh = obj.height / 2;
                    return obj.x - hw <= maxX && obj.x + hw >= minX &&
                           obj.y - hh <= maxY && obj.y + hh >= minY;
                }
            }
            return false;
        };

        objects.forEach(obj => {
            if (testObject(obj)) {
                results.push(obj);
            }
        });

        return results;
    },

    getResizeHandlePosition(obj, handleIndex) {
        const corners = Coordinates.getObjectCorners(obj);
        if (corners.length === 4) {
            const edges = [
                { x: (corners[0].x + corners[1].x) / 2, y: (corners[0].y + corners[1].y) / 2 },
                { x: corners[1].x, y: corners[1].y },
                { x: (corners[1].x + corners[2].x) / 2, y: (corners[1].y + corners[2].y) / 2 },
                { x: corners[2].x, y: corners[2].y },
                { x: (corners[2].x + corners[3].x) / 2, y: (corners[2].y + corners[3].y) / 2 },
                { x: corners[3].x, y: corners[3].y },
                { x: (corners[3].x + corners[0].x) / 2, y: (corners[3].y + corners[0].y) / 2 },
                { x: corners[0].x, y: corners[0].y }
            ];
            return edges[handleIndex];
        }
        return null;
    },

    getRotateHandlePosition(obj) {
        const screenPos = Coordinates.worldToScreen(obj.x, obj.y);
        const screenY = screenPos.y - Coordinates.worldDistanceToScreen(obj.height / 2 + 30);
        const worldPos = Coordinates.screenToWorld(screenPos.x, screenY);
        return { x: screenPos.x, y: screenY, worldX: worldPos.x, worldY: worldPos.y };
    },

    hitTestHandle(x, y, obj) {
        const handles = [];
        for (let i = 0; i < 8; i++) {
            const pos = this.getResizeHandlePosition(obj, i);
            if (pos) {
                const screenPos = Coordinates.worldToScreen(pos.x, pos.y);
                const dx = x - screenPos.x;
                const dy = y - screenPos.y;
                if (Math.sqrt(dx * dx + dy * dy) <= 8) {
                    return { type: 'resize', index: i };
                }
            }
        }
        const rotatePos = this.getRotateHandlePosition(obj);
        const dx = x - rotatePos.x;
        const dy = y - rotatePos.y;
        if (Math.sqrt(dx * dx + dy * dy) <= 10) {
            return { type: 'rotate', index: -1 };
        }
        return null;
    }
};
