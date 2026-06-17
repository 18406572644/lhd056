const MaterialLibrary = {
    categories: {
        floor: {
            name: '地板',
            materials: [
                {
                    id: 'wood_solid',
                    name: '实木地板',
                    type: 'floor',
                    color: '#8B4513',
                    pattern: 'wood',
                    patternColor: '#A0522D',
                    defaultScale: 100
                },
                {
                    id: 'wood_laminate',
                    name: '复合地板',
                    type: 'floor',
                    color: '#DEB887',
                    pattern: 'wood',
                    patternColor: '#D2B48C',
                    defaultScale: 80
                },
                {
                    id: 'tile_white',
                    name: '白色瓷砖',
                    type: 'floor',
                    color: '#FFFFFF',
                    pattern: 'tile',
                    patternColor: '#E0E0E0',
                    groutColor: '#CCCCCC',
                    defaultScale: 60
                },
                {
                    id: 'tile_gray',
                    name: '灰色地砖',
                    type: 'floor',
                    color: '#9E9E9E',
                    pattern: 'tile',
                    patternColor: '#BDBDBD',
                    groutColor: '#757575',
                    defaultScale: 80
                },
                {
                    id: 'marble',
                    name: '大理石',
                    type: 'floor',
                    color: '#F5F5F5',
                    pattern: 'marble',
                    patternColor: '#D0D0D0',
                    defaultScale: 120
                },
                {
                    id: 'carpet_gray',
                    name: '灰色地毯',
                    type: 'floor',
                    color: '#90A4AE',
                    pattern: 'carpet',
                    patternColor: '#78909C',
                    defaultScale: 20
                },
                {
                    id: 'carpet_beige',
                    name: '米色地毯',
                    type: 'floor',
                    color: '#D7CCC8',
                    pattern: 'carpet',
                    patternColor: '#BCAAA4',
                    defaultScale: 20
                },
                {
                    id: 'wood_dark',
                    name: '深色实木',
                    type: 'floor',
                    color: '#5D4037',
                    pattern: 'wood',
                    patternColor: '#6D4C41',
                    defaultScale: 100
                }
            ]
        },
        wall: {
            name: '墙面',
            materials: [
                {
                    id: 'paint_white',
                    name: '白色乳胶漆',
                    type: 'wall',
                    color: '#FAFAFA',
                    pattern: 'solid',
                    defaultScale: 1
                },
                {
                    id: 'paint_cream',
                    name: '米白乳胶漆',
                    type: 'wall',
                    color: '#FFF8E1',
                    pattern: 'solid',
                    defaultScale: 1
                },
                {
                    id: 'paint_blue',
                    name: '淡蓝乳胶漆',
                    type: 'wall',
                    color: '#E3F2FD',
                    pattern: 'solid',
                    defaultScale: 1
                },
                {
                    id: 'paint_green',
                    name: '淡绿乳胶漆',
                    type: 'wall',
                    color: '#E8F5E9',
                    pattern: 'solid',
                    defaultScale: 1
                },
                {
                    id: 'paint_gray',
                    name: '灰色乳胶漆',
                    type: 'wall',
                    color: '#ECEFF1',
                    pattern: 'solid',
                    defaultScale: 1
                },
                {
                    id: 'wallpaper_floral',
                    name: '花纹壁纸',
                    type: 'wall',
                    color: '#FFF3E0',
                    pattern: 'wallpaper_floral',
                    patternColor: '#FFAB91',
                    defaultScale: 50
                },
                {
                    id: 'wallpaper_stripe',
                    name: '条纹壁纸',
                    type: 'wall',
                    color: '#ECEFF1',
                    pattern: 'wallpaper_stripe',
                    patternColor: '#CFD8DC',
                    defaultScale: 30
                },
                {
                    id: 'stone_marble',
                    name: '石材墙面',
                    type: 'wall',
                    color: '#ECEFF1',
                    pattern: 'marble',
                    patternColor: '#B0BEC5',
                    defaultScale: 100
                },
                {
                    id: 'brick_red',
                    name: '红砖墙面',
                    type: 'wall',
                    color: '#D84315',
                    pattern: 'brick',
                    patternColor: '#BF360C',
                    groutColor: '#5D4037',
                    defaultScale: 40
                },
                {
                    id: 'brick_white',
                    name: '白砖墙面',
                    type: 'wall',
                    color: '#ECEFF1',
                    pattern: 'brick',
                    patternColor: '#CFD8DC',
                    groutColor: '#B0BEC5',
                    defaultScale: 40
                }
            ]
        }
    },

    customMaterials: [],

    textureCache: {},

    init() {
        this.loadCustomMaterials();
        this.preloadCustomTextures();
    },

    preloadCustomTextures() {
        this.customMaterials.forEach(material => {
            if (material.isCustom && material.imageData) {
                this.loadCustomTexture(material);
            }
        });
    },

    loadCustomTexture(material) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 256;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 256, 256);
                this.textureCache[material.id] = canvas;
                resolve(canvas);
            };
            img.onerror = () => {
                resolve(null);
            };
            img.src = material.imageData;
        });
    },

    getAllMaterials() {
        const all = [];
        Object.values(this.categories).forEach(cat => {
            all.push(...cat.materials);
        });
        all.push(...this.customMaterials);
        return all;
    },

    getMaterialsByType(type) {
        const materials = [];
        Object.values(this.categories).forEach(cat => {
            cat.materials.forEach(m => {
                if (m.type === type || type === 'all') {
                    materials.push(m);
                }
            });
        });
        this.customMaterials.forEach(m => {
            if (m.type === type || type === 'all') {
                materials.push(m);
            }
        });
        return materials;
    },

    getMaterialById(id) {
        const all = this.getAllMaterials();
        return all.find(m => m.id === id);
    },

    getApplicableMaterials(objectType) {
        const materials = [];
        if (objectType === 'wall') {
            Object.values(this.categories).forEach(cat => {
                cat.materials.forEach(m => {
                    if (m.type === 'wall') {
                        materials.push(m);
                    }
                });
            });
        } else if (objectType === 'furniture' || objectType === 'room') {
            Object.values(this.categories).forEach(cat => {
                cat.materials.forEach(m => {
                    if (m.type === 'floor') {
                        materials.push(m);
                    }
                });
            });
        } else {
            Object.values(this.categories).forEach(cat => {
                materials.push(...cat.materials);
            });
        }
        this.customMaterials.forEach(m => {
            materials.push(m);
        });
        return materials;
    },

    generateTextureCanvas(material, size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (material.isCustom && material.imageData) {
            if (this.textureCache[material.id]) {
                ctx.drawImage(this.textureCache[material.id], 0, 0, size, size);
            } else {
                ctx.fillStyle = '#e5e7eb';
                ctx.fillRect(0, 0, size, size);
                ctx.fillStyle = '#9ca3af';
                ctx.font = '14px DM Sans';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('加载中...', size / 2, size / 2);
                this.loadCustomTexture(material);
            }
            return canvas;
        }

        ctx.fillStyle = material.color;
        ctx.fillRect(0, 0, size, size);

        const patternColor = material.patternColor || '#000000';
        const groutColor = material.groutColor || '#CCCCCC';

        switch (material.pattern) {
            case 'wood':
                this.drawWoodPattern(ctx, size, patternColor);
                break;
            case 'tile':
                this.drawTilePattern(ctx, size, patternColor, groutColor);
                break;
            case 'brick':
                this.drawBrickPattern(ctx, size, patternColor, groutColor);
                break;
            case 'marble':
                this.drawMarblePattern(ctx, size, patternColor);
                break;
            case 'carpet':
                this.drawCarpetPattern(ctx, size, patternColor);
                break;
            case 'wallpaper_floral':
                this.drawWallpaperFloral(ctx, size, patternColor);
                break;
            case 'wallpaper_stripe':
                this.drawWallpaperStripe(ctx, size, patternColor);
                break;
            case 'solid':
            default:
                break;
        }

        return canvas;
    },

    drawWoodPattern(ctx, size, color) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        const plankHeight = size / 4;
        for (let i = 0; i < 5; i++) {
            const y = i * plankHeight;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x <= size; x += 10) {
                const wave = Math.sin(x * 0.02 + i * 0.5) * 2;
                ctx.lineTo(x, y + wave);
            }
            ctx.stroke();

            for (let j = 0; j < 3; j++) {
                const knotX = (i * 3 + j) * (size / 12) + 20;
                const knotY = y + plankHeight / 2 + Math.sin(j) * 5;
                ctx.beginPath();
                ctx.ellipse(knotX, knotY, 6, 4, Math.PI / 4, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    },

    drawTilePattern(ctx, size, color, groutColor) {
        const tileSize = size / 4;
        const groutWidth = 2;

        ctx.fillStyle = groutColor;
        ctx.fillRect(0, 0, size, size);

        ctx.fillStyle = color;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const x = col * tileSize + groutWidth;
                const y = row * tileSize + groutWidth;
                const w = tileSize - groutWidth * 2;
                const h = tileSize - groutWidth * 2;

                const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, this.shadeColor(color, -10));
                ctx.fillStyle = gradient;

                ctx.fillRect(x, y, w, h);
            }
        }
    },

    drawBrickPattern(ctx, size, color, groutColor) {
        const brickWidth = size / 4;
        const brickHeight = size / 8;
        const groutSize = 2;

        ctx.fillStyle = groutColor;
        ctx.fillRect(0, 0, size, size);

        for (let row = 0; row < 10; row++) {
            const offset = row % 2 === 0 ? 0 : brickWidth / 2;
            for (let col = -1; col < 5; col++) {
                const x = col * brickWidth + offset + groutSize;
                const y = row * brickHeight + groutSize;
                const w = brickWidth - groutSize * 2;
                const h = brickHeight - groutSize * 2;

                const variation = (Math.sin(row * 1.5 + col * 2) + 1) * 0.1;
                const brickColor = this.shadeColor(color, variation * 20 - 10);
                ctx.fillStyle = brickColor;
                ctx.fillRect(x, y, w, h);
            }
        }
    },

    drawMarblePattern(ctx, size, color) {
        for (let i = 0; i < 30; i++) {
            const startX = Math.random() * size;
            const startY = Math.random() * size;
            const length = Math.random() * size * 0.8 + size * 0.2;
            const angle = Math.random() * Math.PI;

            ctx.strokeStyle = color;
            ctx.lineWidth = Math.random() * 3 + 0.5;
            ctx.globalAlpha = Math.random() * 0.3 + 0.1;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            for (let t = 0; t <= length; t += 5) {
                const x = startX + Math.cos(angle) * t + Math.sin(t * 0.05) * 10;
                const y = startY + Math.sin(angle) * t + Math.cos(t * 0.05) * 10;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    },

    drawCarpetPattern(ctx, size, color) {
        for (let i = 0; i < 500; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const r = Math.random() * 2 + 0.5;

            ctx.fillStyle = color;
            ctx.globalAlpha = Math.random() * 0.3 + 0.1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;

        for (let i = 0; i < 200; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            const len = Math.random() * 4 + 1;
            const angle = Math.random() * Math.PI * 2;

            ctx.strokeStyle = color;
            ctx.lineWidth = 0.5;
            ctx.globalAlpha = Math.random() * 0.4 + 0.2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    },

    drawWallpaperFloral(ctx, size, color) {
        const spacing = size / 3;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 4; col++) {
                const cx = col * spacing + spacing / 2;
                const cy = row * spacing + spacing / 2;

                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6;

                for (let p = 0; p < 5; p++) {
                    const angle = (p / 5) * Math.PI * 2;
                    const px = cx + Math.cos(angle) * 8;
                    const py = cy + Math.sin(angle) * 8;
                    ctx.beginPath();
                    ctx.ellipse(px, py, 6, 10, angle, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.fillStyle = '#FFEB3B';
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.arc(cx, cy, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    },

    drawWallpaperStripe(ctx, size, color) {
        const stripeWidth = 10;
        const spacing = 30;

        ctx.fillStyle = color;
        for (let x = 0; x < size; x += spacing) {
            ctx.fillRect(x, 0, stripeWidth, size);
        }
    },

    shadeColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    },

    addCustomMaterial(material) {
        this.customMaterials.push(material);
        this.saveCustomMaterials();
    },

    removeCustomMaterial(id) {
        const index = this.customMaterials.findIndex(m => m.id === id);
        if (index !== -1) {
            this.customMaterials.splice(index, 1);
            this.saveCustomMaterials();
        }
    },

    loadCustomMaterials() {
        try {
            const saved = localStorage.getItem('floorplan_custom_materials');
            if (saved) {
                this.customMaterials = JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载自定义材质失败:', e);
        }
    },

    saveCustomMaterials() {
        try {
            localStorage.setItem('floorplan_custom_materials', JSON.stringify(this.customMaterials));
        } catch (e) {
            console.error('保存自定义材质失败:', e);
        }
    }
};
