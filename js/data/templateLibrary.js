const TemplateLibrary = {
    categories: ['一居室', '两居室', '三居室', '复式', '别墅'],

    presetTemplates: [
        {
            id: 'template-1bed-1',
            name: '简约一居',
            category: '一居室',
            area: 45,
            roomCount: 3,
            description: '经典一室一厅一卫布局',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 600, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 600, y1: 0, x2: 600, y2: 750, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 600, y1: 750, x2: 0, y2: 750, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 750, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 350, y1: 0, x2: 350, y2: 450, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 0, y1: 450, x2: 350, y2: 450, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 350, y1: 550, x2: 600, y2: 550, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-2',
                    name: '双人沙发', x: 175, y: 200, width: 160, height: 85,
                    color: '#a8d8ea', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 175, y: 320, width: 120, height: 60,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 475, y: 250, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 540, y: 450, width: 60, height: 180,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 175, y: 600, width: 160, height: 90,
                    color: '#e8d5c4', rotation: 0
                }
            ]
        },
        {
            id: 'template-1bed-2',
            name: '温馨小户型',
            category: '一居室',
            area: 55,
            roomCount: 4,
            description: '开放式厨房设计，空间利用率高',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 700, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 700, y1: 0, x2: 700, y2: 800, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 700, y1: 800, x2: 0, y2: 800, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 800, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 400, y1: 0, x2: 400, y2: 500, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 0, y1: 500, x2: 400, y2: 500, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 400, y1: 600, x2: 700, y2: 600, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 200, y: 200, width: 220, height: 90,
                    color: '#aa96da', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 200, y: 340, width: 120, height: 60,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 550, y: 250, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 640, y: 450, width: 60, height: 200,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 200, y: 650, width: 160, height: 90,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'fridge',
                    name: '冰箱', x: 500, y: 700, width: 70, height: 70,
                    color: '#e6f3ff', rotation: 0
                }
            ]
        },
        {
            id: 'template-2bed-1',
            name: '经典两居',
            category: '两居室',
            area: 75,
            roomCount: 5,
            description: '南北通透，主卧次卧分离',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 850, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 850, y1: 0, x2: 850, y2: 900, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 850, y1: 900, x2: 0, y2: 900, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 900, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 450, y1: 0, x2: 450, y2: 550, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 0, y1: 550, x2: 850, y2: 550, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 450, y1: 550, x2: 450, y2: 900, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 650, y1: 0, x2: 650, y2: 300, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 650, y1: 300, x2: 850, y2: 300, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 225, y: 150, width: 220, height: 90,
                    color: '#a8d8ea', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 225, y: 280, width: 120, height: 60,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 225, y: 420, width: 160, height: 90,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 225, y: 720, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 100, y: 840, width: 60, height: 200,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 650, y: 720, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'desk',
                    name: '书桌', x: 650, y: 420, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                }
            ]
        },
        {
            id: 'template-2bed-2',
            name: '舒适两居',
            category: '两居室',
            area: 85,
            roomCount: 6,
            description: '主卧带独立卫浴，客厅宽敞明亮',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 950, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 950, y1: 0, x2: 950, y2: 950, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 950, y1: 950, x2: 0, y2: 950, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 950, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 600, x2: 550, y2: 600, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 550, y1: 0, x2: 550, y2: 600, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 550, y1: 350, x2: 950, y2: 350, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 750, y1: 350, x2: 750, y2: 950, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 550, y1: 750, x2: 750, y2: 750, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 275, y: 150, width: 220, height: 90,
                    color: '#fcbad3', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 275, y: 280, width: 120, height: 60,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 275, y: 470, width: 180, height: 100,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 275, y: 780, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 100, y: 880, width: 60, height: 220,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 650, y: 150, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'desk',
                    name: '书桌', x: 850, y: 150, width: 140, height: 70,
                    color: '#c9d8c5', rotation: Math.PI / 2
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 650, y: 550, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f9', type: 'furniture', furnitureType: 'fridge',
                    name: '冰箱', x: 600, y: 500, width: 70, height: 70,
                    color: '#e6f3ff', rotation: 0
                }
            ]
        },
        {
            id: 'template-3bed-1',
            name: '三居室标准',
            category: '三居室',
            area: 110,
            roomCount: 7,
            description: '三室两厅两卫，功能分区明确',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 1100, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 1100, y1: 0, x2: 1100, y2: 1000, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 1100, y1: 1000, x2: 0, y2: 1000, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 1000, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 600, x2: 700, y2: 600, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 700, y1: 0, x2: 700, y2: 600, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 350, y1: 600, x2: 350, y2: 1000, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 700, y1: 350, x2: 1100, y2: 350, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 900, y1: 350, x2: 900, y2: 1000, thickness: 12 },
                { id: 'w10', type: 'wall', x1: 700, y1: 750, x2: 900, y2: 750, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 350, y: 150, width: 220, height: 90,
                    color: '#a8d8ea', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 350, y: 280, width: 140, height: 70,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 350, y: 480, width: 200, height: 110,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 175, y: 800, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 50, y: 930, width: 60, height: 220,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 800, y: 150, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 800, y: 550, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'fridge',
                    name: '冰箱', x: 750, y: 480, width: 70, height: 70,
                    color: '#e6f3ff', rotation: 0
                }
            ]
        },
        {
            id: 'template-3bed-2',
            name: '豪华三居',
            category: '三居室',
            area: 130,
            roomCount: 8,
            description: '主卧套房设计，超大客厅',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 1200, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 1200, y1: 0, x2: 1200, y2: 1100, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 1200, y1: 1100, x2: 0, y2: 1100, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 1100, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 650, x2: 750, y2: 650, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 750, y1: 0, x2: 750, y2: 650, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 400, y1: 650, x2: 400, y2: 1100, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 750, y1: 400, x2: 1200, y2: 400, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 950, y1: 400, x2: 950, y2: 1100, thickness: 12 },
                { id: 'w10', type: 'wall', x1: 750, y1: 800, x2: 950, y2: 800, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 375, y: 150, width: 220, height: 90,
                    color: '#fcbad3', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'sofa-2',
                    name: '双人沙发', x: 120, y: 250, width: 160, height: 85,
                    color: '#aa96da', rotation: Math.PI / 2
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 375, y: 290, width: 140, height: 70,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 375, y: 520, width: 200, height: 110,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 200, y: 870, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 60, y: 1030, width: 60, height: 280,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'desk',
                    name: '书桌', x: 340, y: 700, width: 120, height: 60,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 850, y: 150, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f9', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 850, y: 580, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f10', type: 'furniture', furnitureType: 'bathtub',
                    name: '浴缸', x: 850, y: 920, width: 170, height: 80,
                    color: '#e6f7ff', rotation: 0
                }
            ]
        },
        {
            id: 'template-duplex-1',
            name: '复式经典',
            category: '复式',
            area: 160,
            roomCount: 10,
            description: '挑高客厅，动静分离',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 1000, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 1000, y1: 0, x2: 1000, y2: 1200, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 1000, y1: 1200, x2: 0, y2: 1200, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 1200, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 500, x2: 1000, y2: 500, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 500, y1: 0, x2: 500, y2: 500, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 0, y1: 850, x2: 600, y2: 850, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 600, y1: 500, x2: 600, y2: 1200, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 300, y1: 850, x2: 300, y2: 1200, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 250, y: 120, width: 220, height: 90,
                    color: '#a8d8ea', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'coffee-table',
                    name: '茶几', x: 250, y: 250, width: 120, height: 60,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'dining-table',
                    name: '餐桌', x: 750, y: 200, width: 180, height: 100,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 150, y: 1020, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 30, y: 1140, width: 60, height: 240,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'desk',
                    name: '书桌', x: 450, y: 1050, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'bed-double',
                    name: '双人床', x: 800, y: 700, width: 200, height: 180,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'wardrobe',
                    name: '衣柜', x: 660, y: 800, width: 60, height: 200,
                    color: '#e8d5b7', rotation: Math.PI / 2
                },
                {
                    id: 'f9', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 800, y: 350, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f10', type: 'furniture', furnitureType: 'bathtub',
                    name: '浴缸', x: 800, y: 920, width: 170, height: 80,
                    color: '#e6f7ff', rotation: 0
                }
            ]
        },
        {
            id: 'template-villa-1',
            name: '豪华别墅',
            category: '别墅',
            area: 280,
            roomCount: 15,
            description: '独栋别墅，独立花园车库',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 1400, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 1400, y1: 0, x2: 1400, y2: 1200, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 1400, y1: 1200, x2: 0, y2: 1200, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 1200, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 500, x2: 1000, y2: 500, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 500, y1: 0, x2: 500, y2: 500, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 1000, y1: 0, x2: 1000, y2: 500, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 0, y1: 850, x2: 500, y2: 850, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 500, y1: 500, x2: 500, y2: 1200, thickness: 12 },
                { id: 'w10', type: 'wall', x1: 800, y1: 500, x2: 800, y2: 1200, thickness: 12 },
                { id: 'w11', type: 'wall', x1: 1100, y1: 500, x2: 1100, y2: 1200, thickness: 12 },
                { id: 'w12', type: 'wall', x1: 800, y1: 850, x2: 1100, y2: 850, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 250, y: 150, width: 220, height: 90,
                    color: '#a8d8ea', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'sofa-2',
                    name: '双人沙发', x: 750, y: 150, width: 160, height: 85,
                    color: '#aa96da', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'coffee-table',
                    name: '大茶几', x: 500, y: 200, width: 160, height: 90,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'dining-table',
                    name: '大餐桌', x: 750, y: 380, width: 200, height: 110,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'bed-double',
                    name: '主卧大床', x: 250, y: 680, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'wardrobe',
                    name: '步入式衣柜', x: 50, y: 1100, width: 60, height: 280,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'desk',
                    name: '书房书桌', x: 250, y: 1050, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'bed-double',
                    name: '次主卧', x: 650, y: 680, width: 200, height: 180,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f9', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 950, y: 680, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f10', type: 'furniture', furnitureType: 'bed-single',
                    name: '单人床', x: 1250, y: 200, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f11', type: 'furniture', furnitureType: 'desk',
                    name: '书房', x: 1250, y: 450, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f12', type: 'furniture', furnitureType: 'bathtub',
                    name: '按摩浴缸', x: 950, y: 1000, width: 170, height: 80,
                    color: '#e6f7ff', rotation: 0
                },
                {
                    id: 'f13', type: 'furniture', furnitureType: 'fridge',
                    name: '双开门冰箱', x: 1120, y: 150, width: 90, height: 90,
                    color: '#e6f3ff', rotation: 0
                },
                {
                    id: 'f14', type: 'furniture', furnitureType: 'bed-double',
                    name: '客房', x: 1250, y: 750, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f15', type: 'furniture', furnitureType: 'bed-single',
                    name: '保姆房', x: 1250, y: 1050, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                }
            ]
        },
        {
            id: 'template-villa-2',
            name: '现代别墅',
            category: '别墅',
            area: 350,
            roomCount: 18,
            description: '三层现代别墅，带泳池花园',
            isPreset: true,
            objects: [
                { id: 'w1', type: 'wall', x1: 0, y1: 0, x2: 1600, y2: 0, thickness: 12 },
                { id: 'w2', type: 'wall', x1: 1600, y1: 0, x2: 1600, y2: 1400, thickness: 12 },
                { id: 'w3', type: 'wall', x1: 1600, y1: 1400, x2: 0, y2: 1400, thickness: 12 },
                { id: 'w4', type: 'wall', x1: 0, y1: 1400, x2: 0, y2: 0, thickness: 12 },
                { id: 'w5', type: 'wall', x1: 0, y1: 500, x2: 1200, y2: 500, thickness: 12 },
                { id: 'w6', type: 'wall', x1: 600, y1: 0, x2: 600, y2: 500, thickness: 12 },
                { id: 'w7', type: 'wall', x1: 1200, y1: 0, x2: 1200, y2: 1400, thickness: 12 },
                { id: 'w8', type: 'wall', x1: 0, y1: 900, x2: 600, y2: 900, thickness: 12 },
                { id: 'w9', type: 'wall', x1: 600, y1: 500, x2: 600, y2: 1400, thickness: 12 },
                { id: 'w10', type: 'wall', x1: 900, y1: 500, x2: 900, y2: 1400, thickness: 12 },
                { id: 'w11', type: 'wall', x1: 600, y1: 1100, x2: 900, y2: 1100, thickness: 12 },
                {
                    id: 'f1', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 300, y: 150, width: 220, height: 90,
                    color: '#fcbad3', rotation: 0
                },
                {
                    id: 'f2', type: 'furniture', furnitureType: 'sofa-3',
                    name: '三人沙发', x: 900, y: 150, width: 220, height: 90,
                    color: '#aa96da', rotation: 0
                },
                {
                    id: 'f3', type: 'furniture', furnitureType: 'coffee-table',
                    name: '大茶几', x: 600, y: 200, width: 160, height: 90,
                    color: '#d5ecc2', rotation: 0
                },
                {
                    id: 'f4', type: 'furniture', furnitureType: 'dining-table',
                    name: '大餐桌', x: 900, y: 380, width: 220, height: 120,
                    color: '#e8d5c4', rotation: 0
                },
                {
                    id: 'f5', type: 'furniture', furnitureType: 'bed-double',
                    name: '主卧大床', x: 300, y: 700, width: 220, height: 200,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f6', type: 'furniture', furnitureType: 'wardrobe',
                    name: '步入式衣柜', x: 50, y: 1200, width: 60, height: 320,
                    color: '#e8d5b7', rotation: -Math.PI / 2
                },
                {
                    id: 'f7', type: 'furniture', furnitureType: 'desk',
                    name: '主卧床头柜', x: 300, y: 1250, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f8', type: 'furniture', furnitureType: 'bed-double',
                    name: '次主卧', x: 750, y: 700, width: 200, height: 180,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f9', type: 'furniture', furnitureType: 'bed-double',
                    name: '客卧', x: 1050, y: 200, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f10', type: 'furniture', furnitureType: 'bed-single',
                    name: '儿童房', x: 750, y: 1250, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f11', type: 'furniture', furnitureType: 'bed-single',
                    name: '书房床', x: 1400, y: 200, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f12', type: 'furniture', furnitureType: 'desk',
                    name: '书房书桌', x: 1400, y: 450, width: 140, height: 70,
                    color: '#c9d8c5', rotation: 0
                },
                {
                    id: 'f13', type: 'furniture', furnitureType: 'bathtub',
                    name: '按摩浴缸', x: 1050, y: 750, width: 180, height: 90,
                    color: '#e6f7ff', rotation: 0
                },
                {
                    id: 'f14', type: 'furniture', furnitureType: 'fridge',
                    name: '双开门冰箱', x: 1320, y: 150, width: 100, height: 100,
                    color: '#e6f3ff', rotation: 0
                },
                {
                    id: 'f15', type: 'furniture', furnitureType: 'bed-double',
                    name: '老人房', x: 1400, y: 700, width: 200, height: 180,
                    color: '#b8e0d2', rotation: 0
                },
                {
                    id: 'f16', type: 'furniture', furnitureType: 'bed-double',
                    name: '客房', x: 1400, y: 1000, width: 200, height: 180,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f17', type: 'furniture', furnitureType: 'bed-single',
                    name: '保姆房', x: 1400, y: 1300, width: 120, height: 200,
                    color: '#d6e2f0', rotation: 0
                },
                {
                    id: 'f18', type: 'furniture', furnitureType: 'desk',
                    name: '办公桌', x: 300, y: 1050, width: 160, height: 80,
                    color: '#c9d8c5', rotation: 0
                }
            ]
        }
    ],

    getAllTemplates() {
        const privateTemplates = Store.templateLibrary ? Store.templateLibrary.privateTemplates || [] : [];
        return [...this.presetTemplates, ...privateTemplates];
    },

    getTemplatesByCategory(category) {
        if (category === '全部') return this.getAllTemplates();
        return this.getAllTemplates().filter(t => t.category === category);
    },

    getTemplateById(id) {
        return this.getAllTemplates().find(t => t.id === id);
    },

    searchTemplates(keyword) {
        if (!keyword) return this.getAllTemplates();
        const lower = keyword.toLowerCase();
        return this.getAllTemplates().filter(t =>
            t.name.toLowerCase().includes(lower) ||
            t.description.toLowerCase().includes(lower) ||
            t.category.toLowerCase().includes(lower)
        );
    },

    filterTemplates({ category = null, minArea = null, maxArea = null, minRooms = null, maxRooms = null } = {}) {
        let templates = this.getAllTemplates();

        if (category && category !== '全部') {
            templates = templates.filter(t => t.category === category);
        }
        if (minArea !== null) {
            templates = templates.filter(t => t.area >= minArea);
        }
        if (maxArea !== null) {
            templates = templates.filter(t => t.area <= maxArea);
        }
        if (minRooms !== null) {
            templates = templates.filter(t => t.roomCount >= minRooms);
        }
        if (maxRooms !== null) {
            templates = templates.filter(t => t.roomCount <= maxRooms);
        }

        return templates;
    }
};

window.TemplateLibrary = TemplateLibrary;
