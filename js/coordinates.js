const Coordinates = {
    screenToWorld(screenX, screenY) {
        const { width, height, scale, offsetX, offsetY } = Store.canvas;
        return {
            x: (screenX - width / 2 - offsetX) / scale,
            y: (screenY - height / 2 - offsetY) / scale
        };
    },

    worldToScreen(worldX, worldY) {
        const { width, height, scale, offsetX, offsetY } = Store.canvas;
        return {
            x: worldX * scale + width / 2 + offsetX,
            y: worldY * scale + height / 2 + offsetY
        };
    },

    screenDistanceToWorld(distance) {
        return distance / Store.canvas.scale;
    },

    worldDistanceToScreen(distance) {
        return distance * Store.canvas.scale;
    },

    getRotatedPoint(x, y, cx, cy, rotation) {
        const cos = Math.cos(rotation);
        const sin = Math.sin(rotation);
        return {
            x: cx + (x - cx) * cos - (y - cy) * sin,
            y: cy + (x - cx) * sin + (y - cy) * cos
        };
    },

    getObjectCorners(obj) {
        if (obj.type === 'group') {
            if (obj.width && obj.height && obj.x !== undefined && obj.y !== undefined) {
                const hw = obj.width / 2;
                const hh = obj.height / 2;
                const corners = [
                    { x: obj.x - hw, y: obj.y - hh },
                    { x: obj.x + hw, y: obj.y - hh },
                    { x: obj.x + hw, y: obj.y + hh },
                    { x: obj.x - hw, y: obj.y + hh }
                ];
                if (obj.rotation) {
                    return corners.map(c => this.getRotatedPoint(c.x, c.y, obj.x, obj.y, obj.rotation));
                }
                return corners;
            }
            return [];
        }
        if (obj.type === 'furniture' || obj.type === 'text') {
            const hw = obj.width / 2;
            const hh = obj.height / 2;
            const corners = [
                { x: obj.x - hw, y: obj.y - hh },
                { x: obj.x + hw, y: obj.y - hh },
                { x: obj.x + hw, y: obj.y + hh },
                { x: obj.x - hw, y: obj.y + hh }
            ];
            if (obj.rotation) {
                return corners.map(c => this.getRotatedPoint(c.x, c.y, obj.x, obj.y, obj.rotation));
            }
            return corners;
        }
        return [];
    },

    formatDimension(cm) {
        return (cm / 100).toFixed(2) + 'm';
    },

    cloneObjectDeep(obj) {
        const clone = {};
        for (const key in obj) {
            if (Array.isArray(obj[key])) {
                clone[key] = obj[key].map(item => 
                    typeof item === 'object' ? this.cloneObjectDeep(item) : item
                );
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                clone[key] = this.cloneObjectDeep(obj[key]);
            } else {
                clone[key] = obj[key];
            }
        }
        return clone;
    }
};
