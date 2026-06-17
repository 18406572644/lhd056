const Renderer3D = {
    scene: null,
    camera: null,
    renderer: null,
    canvas: null,
    container: null,

    wallMeshes: new Map(),
    furnitureMeshes: new Map(),
    floorMesh: null,

    isDragging: false,
    isRightDragging: false,
    isPanning: false,
    lastMouseX: 0,
    lastMouseY: 0,

    needsUpdate: true,

    init() {
        this.canvas = document.getElementById('canvas-3d');
        this.initThree();
        this.setupEventListeners();
    },

    initThree() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
        this.updateCameraFromStore();

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            preserveDrawingBuffer: true
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.addLights();
        this.createFloor();
    },

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(200, 400, 200);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.left = -1000;
        directionalLight.shadow.camera.right = 1000;
        directionalLight.shadow.camera.top = 1000;
        directionalLight.shadow.camera.bottom = -1000;
        this.scene.add(directionalLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-200, 200, -200);
        this.scene.add(fillLight);
    },

    createFloor() {
        const floorGeometry = new THREE.PlaneGeometry(2000, 2000);
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            roughness: 0.8,
            metalness: 0.1
        });
        this.floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        this.floorMesh.rotation.x = -Math.PI / 2;
        this.floorMesh.receiveShadow = true;
        this.scene.add(this.floorMesh);

        const gridHelper = new THREE.GridHelper(2000, 100, 0xcccccc, 0xe0e0e0);
        this.scene.add(gridHelper);
    },

    updateCameraFromStore() {
        const cam = Store.camera3D;
        const distance = cam.distance;

        const theta = cam.angleX;
        const phi = cam.angleY;

        const x = cam.targetX + distance * Math.sin(phi) * Math.cos(theta);
        const y = cam.targetY + distance * Math.cos(phi);
        const z = cam.targetZ + distance * Math.sin(phi) * Math.sin(theta);

        this.camera.position.set(x, y, z);
        this.camera.lookAt(cam.targetX, cam.targetY, cam.targetZ);
    },

    render() {
        if (!Store.is3DMode) return;

        if (this.needsUpdate) {
            this.updateAllMeshes();
            this.needsUpdate = false;
        }

        this.updateCameraFromStore();
        this.renderer.render(this.scene, this.camera);
    },

    markForUpdate() {
        this.needsUpdate = true;
    },

    getAllObjects() {
        const walls = [];
        const furnitureList = [];

        const collectObjects = (objs) => {
            objs.forEach(obj => {
                if (obj.type === 'wall') {
                    walls.push(obj);
                } else if (obj.type === 'furniture') {
                    furnitureList.push(obj);
                } else if (obj.type === 'group' && obj.children) {
                    collectObjects(obj.children);
                }
            });
        };
        collectObjects(Store.objects);

        return { walls, furnitureList };
    },

    updateAllMeshes() {
        const { walls, furnitureList } = this.getAllObjects();

        const wallIds = new Set(walls.map(w => w.id));
        const furnIds = new Set(furnitureList.map(f => f.id));

        for (const [id, mesh] of this.wallMeshes) {
            if (!wallIds.has(id)) {
                this.scene.remove(mesh);
                this.wallMeshes.delete(id);
            }
        }

        for (const [id, mesh] of this.furnitureMeshes) {
            if (!furnIds.has(id)) {
                this.scene.remove(mesh);
                this.furnitureMeshes.delete(id);
            }
        }

        walls.forEach(wall => {
            this.updateWallMesh(wall);
        });

        furnitureList.forEach(furniture => {
            this.updateFurnitureMesh(furniture);
        });
    },

    getWallHash(wall) {
        return `${wall.x1}_${wall.y1}_${wall.x2}_${wall.y2}_${wall.thickness}_${wall.wallHeight || Store.defaultWallHeight}`;
    },

    getFurnitureHash(furniture) {
        return `${furniture.x}_${furniture.y}_${furniture.width}_${furniture.depth || furniture.height}_${furniture.objectHeight || 50}_${furniture.rotation || 0}_${furniture.color}`;
    },

    updateWallMesh(wall) {
        const hash = this.getWallHash(wall);
        const existing = this.wallMeshes.get(wall.id);

        if (existing && existing.userData.hash === hash) {
            return;
        }

        if (existing) {
            this.scene.remove(existing);
        }

        const mesh = this.createWallMesh(wall);
        if (mesh) {
            mesh.userData.hash = hash;
            this.wallMeshes.set(wall.id, mesh);
        }
    },

    createWallMesh(wall) {
        const x1 = wall.x1;
        const y1 = wall.y1;
        const x2 = wall.x2;
        const y2 = wall.y2;
        const thickness = wall.thickness;
        const height = wall.wallHeight || Store.defaultWallHeight;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length < 0.1) return null;

        const geometry = new THREE.BoxGeometry(length, height, thickness);

        const wallColor = 0x5a5a6a;
        const material = new THREE.MeshStandardMaterial({
            color: wallColor,
            roughness: 0.7,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        mesh.position.set(midX, height / 2, midY);

        const angle = Math.atan2(dy, dx);
        mesh.rotation.y = -angle;

        mesh.userData = { type: 'wall', id: wall.id };
        this.scene.add(mesh);
        return mesh;
    },

    updateFurnitureMesh(furniture) {
        const hash = this.getFurnitureHash(furniture);
        const existing = this.furnitureMeshes.get(furniture.id);

        if (existing && existing.userData.hash === hash) {
            return;
        }

        if (existing) {
            this.scene.remove(existing);
        }

        const mesh = this.createFurnitureMesh(furniture);
        if (mesh) {
            mesh.userData.hash = hash;
            this.furnitureMeshes.set(furniture.id, mesh);
        }
    },

    createFurnitureMesh(furniture) {
        const width = furniture.width;
        const depth = furniture.depth || furniture.height;
        const height = furniture.objectHeight || 50;

        const geometry = new THREE.BoxGeometry(width, height, depth);

        let color = 0x88aacc;
        if (furniture.color) {
            color = parseInt(furniture.color.replace('#', '0x'));
        }

        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.6,
            metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(furniture.x, height / 2, furniture.y);
        mesh.rotation.y = -(furniture.rotation || 0);

        mesh.userData = { type: 'furniture', id: furniture.id };
        this.scene.add(mesh);
        return mesh;
    },

    setupEventListeners() {
        const canvas = this.canvas;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        window.addEventListener('resize', () => this.resize());
    },

    onMouseDown(e) {
        if (e.button === 0) {
            this.isDragging = true;
        } else if (e.button === 2) {
            this.isPanning = true;
        }
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    },

    onMouseMove(e) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;

        if (this.isDragging) {
            this.rotateCamera(dx * 0.005, dy * 0.005);
        } else if (this.isPanning) {
            this.panCamera(dx, dy);
        }

        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    },

    onMouseUp(e) {
        this.isDragging = false;
        this.isPanning = false;
    },

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1.1 : 0.9;
        this.zoomCamera(delta);
    },

    rotateCamera(dx, dy) {
        const cam = Store.camera3D;
        let newAngleX = cam.angleX - dx;
        let newAngleY = cam.angleY + dy;

        newAngleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.1, newAngleY));

        Store.setCamera3D({
            angleX: newAngleX,
            angleY: newAngleY
        });
    },

    panCamera(dx, dy) {
        const cam = Store.camera3D;
        const panSpeed = cam.distance * 0.001;

        const cosX = Math.cos(cam.angleX);
        const sinX = Math.sin(cam.angleX);

        const targetX = cam.targetX - dx * cosX * panSpeed;
        const targetZ = cam.targetZ + dx * sinX * panSpeed;
        const targetY = cam.targetY + dy * panSpeed;

        Store.setCamera3D({
            targetX: targetX,
            targetY: targetY,
            targetZ: targetZ
        });
    },

    zoomCamera(factor) {
        const cam = Store.camera3D;
        let newDistance = cam.distance * factor;
        newDistance = Math.max(100, Math.min(5000, newDistance));
        Store.setCamera3D({ distance: newDistance });
    },

    resize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    },

    exportToImage() {
        this.render();
        return this.canvas.toDataURL('image/png');
    }
};
