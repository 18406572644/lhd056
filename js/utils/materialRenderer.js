const MaterialRenderer = {
    textureCache: {},

    getTexture(materialId, scale = 1, rotation = 0) {
        const cacheKey = `${materialId}_${scale}_${rotation}`;
        if (this.textureCache[cacheKey]) {
            return this.textureCache[cacheKey];
        }

        const material = MaterialLibrary.getMaterialById(materialId);
        if (!material) return null;

        const baseCanvas = MaterialLibrary.generateTextureCanvas(material, 256);
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 256;
        textureCanvas.height = 256;
        const ctx = textureCanvas.getContext('2d');

        if (rotation !== 0) {
            ctx.save();
            ctx.translate(128, 128);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.drawImage(baseCanvas, -128, -128, 256, 256);
            ctx.restore();
        } else {
            ctx.drawImage(baseCanvas, 0, 0);
        }

        this.textureCache[cacheKey] = textureCanvas;
        return textureCanvas;
    },

    clearCache() {
        this.textureCache = {};
    },

    drawFilledRect(ctx, x, y, width, height, materialId, options = {}) {
        const {
            scale = 1,
            rotation = 0,
            opacity = 1
        } = options;

        const material = MaterialLibrary.getMaterialById(materialId);
        if (!material) return;

        const textureScale = scale * (material.defaultScale || 50);
        const tileSize = textureScale * Store.canvas.scale;

        if (tileSize <= 0) return;

        const texture = this.getTexture(materialId, scale, rotation);
        if (!texture) return;

        ctx.save();

        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        const pattern = ctx.createPattern(texture, 'repeat');

        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(x, y, width, height);
        }

        ctx.restore();
    },

    drawFilledPolygon(ctx, points, materialId, options = {}) {
        const {
            scale = 1,
            rotation = 0,
            opacity = 1
        } = options;

        const material = MaterialLibrary.getMaterialById(materialId);
        if (!material || points.length < 3) return;

        const textureScale = scale * (material.defaultScale || 50);
        const tileSize = textureScale * Store.canvas.scale;

        if (tileSize <= 0) return;

        const texture = this.getTexture(materialId, scale, rotation);
        if (!texture) return;

        ctx.save();

        if (opacity < 1) {
            ctx.globalAlpha = opacity;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();

        const pattern = ctx.createPattern(texture, 'repeat');
        if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fill();
        }

        ctx.restore();
    },

    drawFurnitureMaterial(ctx, furniture) {
        if (!furniture.materialId) return false;

        const screenPos = Coordinates.worldToScreen(furniture.x, furniture.y);
        const screenWidth = Coordinates.worldDistanceToScreen(furniture.width);
        const screenHeight = Coordinates.worldDistanceToScreen(furniture.height);

        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(furniture.rotation || 0);

        this.drawFilledRect(
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

        ctx.restore();
        return true;
    },

    drawWallMaterial(ctx, wall) {
        if (!wall.materialId) return false;

        const start = Coordinates.worldToScreen(wall.x1, wall.y1);
        const end = Coordinates.worldToScreen(wall.x2, wall.y2);
        const thickness = Coordinates.worldDistanceToScreen(wall.thickness);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len === 0) return false;

        const nx = -dy / len * thickness / 2;
        const ny = dx / len * thickness / 2;

        const points = [
            { x: start.x + nx, y: start.y + ny },
            { x: end.x + nx, y: end.y + ny },
            { x: end.x - nx, y: end.y - ny },
            { x: start.x - nx, y: start.y - ny }
        ];

        this.drawFilledPolygon(
            ctx,
            points,
            wall.materialId,
            {
                scale: wall.materialScale || 1,
                rotation: wall.materialRotation || 0,
                opacity: wall.materialOpacity !== undefined ? wall.materialOpacity : 1
            }
        );

        return true;
    },

    drawRoomFloor(ctx, room) {
        if (!room.floorMaterialId) return false;

        const corners = [
            { x: room.x1, y: room.y1 },
            { x: room.x2, y: room.y1 },
            { x: room.x2, y: room.y2 },
            { x: room.x1, y: room.y2 }
        ];

        const screenCorners = corners.map(c => Coordinates.worldToScreen(c.x, c.y));

        this.drawFilledPolygon(
            ctx,
            screenCorners,
            room.floorMaterialId,
            {
                scale: room.floorMaterialScale || 1,
                rotation: room.floorMaterialRotation || 0,
                opacity: room.floorMaterialOpacity !== undefined ? room.floorMaterialOpacity : 1
            }
        );

        return true;
    },

    applyMaterialToObject(objectId, materialId) {
        const obj = Store.getObject(objectId);
        if (!obj) return;

        const updates = { materialId: materialId };
        if (obj.type === 'room') {
            updates.floorMaterialId = materialId;
        }
        Store.updateObject(objectId, updates);
        this.clearCache();
    },

    updateMaterialParams(objectId, params) {
        const obj = Store.getObject(objectId);
        if (!obj) return;

        const updates = {};
        if (params.scale !== undefined) {
            updates.materialScale = params.scale;
            if (obj.type === 'room') {
                updates.floorMaterialScale = params.scale;
            }
        }
        if (params.rotation !== undefined) {
            updates.materialRotation = params.rotation;
            if (obj.type === 'room') {
                updates.floorMaterialRotation = params.rotation;
            }
        }
        if (params.opacity !== undefined) {
            updates.materialOpacity = params.opacity;
            if (obj.type === 'room') {
                updates.floorMaterialOpacity = params.opacity;
            }
        }

        Store.updateObject(objectId, updates);
        this.clearCache();
    },

    removeMaterialFromObject(objectId) {
        const obj = Store.getObject(objectId);
        if (!obj) return;

        const updates = { materialId: null };
        if (obj.type === 'room') {
            updates.floorMaterialId = null;
        }
        Store.updateObject(objectId, updates);
    }
};
