const Snap = {
    snapToGrid(value, gridSize) {
        return Math.round(value / gridSize) * gridSize;
    },

    snapPointToGrid(x, y, gridSize) {
        return {
            x: this.snapToGrid(x, gridSize),
            y: this.snapToGrid(y, gridSize)
        };
    },

    snapObjectToGrid(obj) {
        const gridSize = Store.canvas.gridSize;
        if (obj.type === 'furniture' || obj.type === 'text') {
            obj.x = this.snapToGrid(obj.x, gridSize);
            obj.y = this.snapToGrid(obj.y, gridSize);
            obj.width = this.snapToGrid(obj.width, gridSize);
            obj.height = this.snapToGrid(obj.height, gridSize);
        } else if (obj.type === 'wall') {
            obj.x1 = this.snapToGrid(obj.x1, gridSize);
            obj.y1 = this.snapToGrid(obj.y1, gridSize);
            obj.x2 = this.snapToGrid(obj.x2, gridSize);
            obj.y2 = this.snapToGrid(obj.y2, gridSize);
        } else if (obj.type === 'dimension') {
            obj.x1 = this.snapToGrid(obj.x1, gridSize);
            obj.y1 = this.snapToGrid(obj.y1, gridSize);
            obj.x2 = this.snapToGrid(obj.x2, gridSize);
            obj.y2 = this.snapToGrid(obj.y2, gridSize);
        }
    },

    snapAngle(angle, snapDegrees = 15) {
        const snapRad = snapDegrees * Math.PI / 180;
        return Math.round(angle / snapRad) * snapRad;
    },

    snapPointToWall(x, y, excludeWallId = null) {
        if (typeof WallConnection !== 'undefined') {
            return WallConnection.snapToWallFeature(x, y, excludeWallId);
        }
        return null;
    },

    snapPointToWallAndGrid(x, y, excludeWallId = null, gridSize = null) {
        const grid = gridSize || Store.canvas.gridSize;
        const gridSnapped = this.snapPointToGrid(x, y, grid);

        const wallSnap = this.snapPointToWall(x, y, excludeWallId);
        if (wallSnap) {
            return {
                x: wallSnap.x,
                y: wallSnap.y,
                snapped: true,
                snapType: wallSnap.type,
                wallSnap: wallSnap
            };
        }

        return {
            x: gridSnapped.x,
            y: gridSnapped.y,
            snapped: false,
            snapType: 'grid',
            wallSnap: null
        };
    }
};
