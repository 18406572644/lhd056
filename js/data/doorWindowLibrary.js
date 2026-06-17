const DoorWindowLibrary = {
    door: [
        {
            id: 'single-door',
            name: '单开门',
            width: 90,
            height: 12,
            objectHeight: 210,
            color: '#8B6914',
            icon: 'single-door',
            openDirection: 'left',
            category: 'door'
        },
        {
            id: 'double-door',
            name: '双开门',
            width: 160,
            height: 12,
            objectHeight: 210,
            color: '#8B6914',
            icon: 'double-door',
            openDirection: 'both',
            category: 'door'
        },
        {
            id: 'sliding-door',
            name: '推拉门',
            width: 160,
            height: 8,
            objectHeight: 210,
            color: '#6B7280',
            icon: 'sliding-door',
            openDirection: 'right',
            category: 'door'
        }
    ],
    window: [
        {
            id: 'casement-window',
            name: '平开窗',
            width: 120,
            height: 8,
            objectHeight: 150,
            color: '#93C5FD',
            icon: 'casement-window',
            openDirection: 'left',
            category: 'window'
        },
        {
            id: 'sliding-window',
            name: '推拉窗',
            width: 150,
            height: 8,
            objectHeight: 150,
            color: '#93C5FD',
            icon: 'sliding-window',
            openDirection: 'right',
            category: 'window'
        }
    ],

    getIcon(icon) {
        const icons = {
            'single-door': '🚪',
            'double-door': '🚪🚪',
            'sliding-door': '↔🚪',
            'casement-window': '🪟',
            'sliding-window': '↔🪟'
        };
        return icons[icon] || '🚪';
    },

    getAll() {
        return [...this.door, ...this.window];
    },

    getById(id) {
        return this.getAll().find(item => item.id === id);
    }
};
