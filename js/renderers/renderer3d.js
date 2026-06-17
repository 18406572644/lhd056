const Renderer3D = {
    scene: null,
    camera: null,
    renderer: null,
    canvas: null,
    container: null,

    wallMeshes: new Map(),
    furnitureMeshes: new Map(),
    doorWindowMeshes: new Map(),
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
        const doorWindowList = [];

        const collectObjects = (objs) => {
            objs.forEach(obj => {
                if (obj.type === 'wall') {
                    walls.push(obj);
                } else if (obj.type === 'furniture') {
                    furnitureList.push(obj);
                } else if (obj.type === 'doorWindow') {
                    doorWindowList.push(obj);
                } else if (obj.type === 'group' && obj.children) {
                    collectObjects(obj.children);
                }
            });
        };
        collectObjects(Store.objects);

        return { walls, furnitureList, doorWindowList };
    },

    updateAllMeshes() {
        const { walls, furnitureList, doorWindowList } = this.getAllObjects();

        const wallIds = new Set(walls.map(w => w.id));
        const furnIds = new Set(furnitureList.map(f => f.id));
        const dwIds = new Set(doorWindowList.map(d => d.id));

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

        for (const [id, mesh] of this.doorWindowMeshes) {
            if (!dwIds.has(id)) {
                this.scene.remove(mesh);
                this.doorWindowMeshes.delete(id);
            }
        }

        walls.forEach(wall => {
            this.updateWallMesh(wall);
        });

        furnitureList.forEach(furniture => {
            this.updateFurnitureMesh(furniture);
        });

        doorWindowList.forEach(dw => {
            this.updateDoorWindowMesh(dw);
        });
    },

    getWallHash(wall) {
        return `${wall.x1}_${wall.y1}_${wall.x2}_${wall.y2}_${wall.thickness}_${wall.wallHeight || Store.defaultWallHeight}_${wall.materialId || ''}_${wall.materialScale || ''}_${wall.materialRotation || ''}_${wall.materialOpacity || ''}`;
    },

    getFurnitureHash(furniture) {
        return `${furniture.x}_${furniture.y}_${furniture.width}_${furniture.depth || furniture.height}_${furniture.objectHeight || 50}_${furniture.rotation || 0}_${furniture.color}_${furniture.materialId || ''}_${furniture.materialScale || ''}_${furniture.materialRotation || ''}_${furniture.materialOpacity || ''}`;
    },

    updateWallMesh(wall) {
        const hash = this.getWallHash(wall);
        const existing = this.wallMeshes.get(wall.id);

        if (existing && existing.userData.hash === hash) {
            return;
        }

        if (existing) {
            if (existing.material && existing.material.map) {
                existing.material.map.dispose();
            }
            if (existing.material) {
                existing.material.dispose();
            }
            existing.geometry.dispose();
            this.scene.remove(existing);
        }

        const mesh = this.createWallMesh(wall);
        if (mesh) {
            mesh.userData.hash = hash;
            this.wallMeshes.set(wall.id, mesh);
        }
    },

    createThreeMaterial(materialId, materialScale, materialRotation, materialOpacity, fallbackColor) {
        const opacity = materialOpacity !== undefined ? materialOpacity : 1;

        if (!materialId || typeof MaterialLibrary === 'undefined') {
            return new THREE.MeshStandardMaterial({
                color: fallbackColor,
                roughness: 0.7,
                metalness: 0.1,
                transparent: opacity < 1,
                opacity: opacity
            });
        }

        const matDef = MaterialLibrary.getMaterialById(materialId);
        if (!matDef) {
            return new THREE.MeshStandardMaterial({
                color: fallbackColor,
                roughness: 0.7,
                metalness: 0.1,
                transparent: opacity < 1,
                opacity: opacity
            });
        }

        const textureCanvas = MaterialLibrary.generateTextureCanvas(matDef, 256);
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        const scale = materialScale || 1;
        const repeatCount = Math.max(1, scale * 2);
        texture.repeat.set(repeatCount, repeatCount);

        if (materialRotation) {
            texture.rotation = materialRotation * Math.PI / 180;
            texture.center.set(0.5, 0.5);
        }

        const threeColor = new THREE.Color(matDef.color);

        return new THREE.MeshStandardMaterial({
            map: texture,
            color: threeColor,
            roughness: 0.7,
            metalness: 0.1,
            transparent: opacity < 1,
            opacity: opacity
        });
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
        const material = this.createThreeMaterial(
            wall.materialId,
            wall.materialScale,
            wall.materialRotation,
            wall.materialOpacity,
            wallColor
        );

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
            if (existing.material && existing.material.map) {
                existing.material.map.dispose();
            }
            if (existing.material) {
                existing.material.dispose();
            }
            existing.geometry.dispose();
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

        const material = this.createThreeMaterial(
            furniture.materialId,
            furniture.materialScale,
            furniture.materialRotation,
            furniture.materialOpacity,
            color
        );

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        mesh.position.set(furniture.x, height / 2, furniture.y);
        mesh.rotation.y = -(furniture.rotation || 0);

        mesh.userData = { type: 'furniture', id: furniture.id };
        this.scene.add(mesh);
        return mesh;
    },

    getDoorWindowHash(dw) {
        return `${dw.x}_${dw.y}_${dw.width}_${dw.height}_${dw.objectHeight}_${dw.angle}_${dw.doorWindowType}_${dw.wallId}_${dw.wallT}_${dw.color}_${dw.openDirection}`;
    },

    updateDoorWindowMesh(dw) {
        const hash = this.getDoorWindowHash(dw);
        const existing = this.doorWindowMeshes.get(dw.id);

        if (existing && existing.userData.hash === hash) {
            return;
        }

        if (existing) {
            if (existing.children) {
                existing.children.forEach(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
            this.scene.remove(existing);
        }

        const group = this.createDoorWindowMesh(dw);
        if (group) {
            group.userData.hash = hash;
            this.doorWindowMeshes.set(dw.id, group);
        }
    },

    createDoorWindowMesh(dw) {
        const wall = Store.getObject(dw.wallId);
        if (!wall) return null;

        const dwWidth = dw.width;
        const dwHeight = dw.objectHeight || 210;
        const wallThickness = wall.thickness;
        const wallHeight = wall.wallHeight || Store.defaultWallHeight;
        const angle = dw.angle || 0;

        const group = new THREE.Group();
        const isDoor = dw.category === 'door';

        if (isDoor) {
            const frameColor = new THREE.Color(dw.color || '#8B6914');
            const frameMat = new THREE.MeshStandardMaterial({
                color: frameColor,
                roughness: 0.6,
                metalness: 0.1
            });

            const frameThickness = 5;
            const frameTop = new THREE.Mesh(
                new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
                frameMat
            );
            frameTop.position.set(0, dwHeight / 2 - frameThickness / 2, 0);
            frameTop.castShadow = true;
            group.add(frameTop);

            const frameLeft = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, dwHeight, wallThickness),
                frameMat
            );
            frameLeft.position.set(-dwWidth / 2 + frameThickness / 2, 0, 0);
            frameLeft.castShadow = true;
            group.add(frameLeft);

            const frameRight = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, dwHeight, wallThickness),
                frameMat
            );
            frameRight.position.set(dwWidth / 2 - frameThickness / 2, 0, 0);
            frameRight.castShadow = true;
            group.add(frameRight);

            if (dw.doorWindowType === 'sliding-door') {
                const panelMat = new THREE.MeshStandardMaterial({
                    color: frameColor,
                    roughness: 0.5,
                    metalness: 0.2,
                    transparent: true,
                    opacity: 0.7
                });
                const panelWidth = (dwWidth - frameThickness * 2) / 2;
                const panelHeight = dwHeight - frameThickness * 2;

                const panel1 = new THREE.Mesh(
                    new THREE.BoxGeometry(panelWidth, panelHeight, 3),
                    panelMat
                );
                panel1.position.set(-dwWidth / 4, 0, 0);
                panel1.castShadow = true;
                group.add(panel1);

                const panel2 = new THREE.Mesh(
                    new THREE.BoxGeometry(panelWidth, panelHeight, 3),
                    panelMat
                );
                panel2.position.set(dwWidth / 4, 0, 0);
                panel2.castShadow = true;
                group.add(panel2);
            } else {
                const doorColor = new THREE.Color(dw.color || '#8B6914');
                const doorMat = new THREE.MeshStandardMaterial({
                    color: doorColor,
                    roughness: 0.5,
                    metalness: 0.1,
                    transparent: true,
                    opacity: 0.6
                });

                if (dw.doorWindowType === 'single-door') {
                    const doorPanel = new THREE.Mesh(
                        new THREE.BoxGeometry(dwWidth - frameThickness * 2, dwHeight - frameThickness * 2, 3),
                        doorMat
                    );
                    doorPanel.position.set(0, 0, 0);
                    doorPanel.castShadow = true;
                    group.add(doorPanel);
                } else if (dw.doorWindowType === 'double-door') {
                    const panelWidth = (dwWidth - frameThickness * 3) / 2;
                    const panelHeight = dwHeight - frameThickness * 2;

                    const leftPanel = new THREE.Mesh(
                        new THREE.BoxGeometry(panelWidth, panelHeight, 3),
                        doorMat
                    );
                    leftPanel.position.set(-dwWidth / 4 - frameThickness / 4, 0, 0);
                    leftPanel.castShadow = true;
                    group.add(leftPanel);

                    const rightPanel = new THREE.Mesh(
                        new THREE.BoxGeometry(panelWidth, panelHeight, 3),
                        doorMat
                    );
                    rightPanel.position.set(dwWidth / 4 + frameThickness / 4, 0, 0);
                    rightPanel.castShadow = true;
                    group.add(rightPanel);
                }
            }

        } else {
            const frameColor = new THREE.Color(dw.color || '#93C5FD');
            const frameMat = new THREE.MeshStandardMaterial({
                color: frameColor,
                roughness: 0.4,
                metalness: 0.2
            });

            const frameThickness = 4;
            const sillHeight = 80;
            const winHeight = dwHeight - frameThickness * 2;
            const winBottom = sillHeight - dwHeight / 2;

            const frameTop = new THREE.Mesh(
                new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
                frameMat
            );
            frameTop.position.set(0, winBottom + winHeight, 0);
            frameTop.castShadow = true;
            group.add(frameTop);

            const frameBottom = new THREE.Mesh(
                new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
                frameMat
            );
            frameBottom.position.set(0, winBottom + frameThickness / 2, 0);
            frameBottom.castShadow = true;
            group.add(frameBottom);

            const frameLeft = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, winHeight, wallThickness),
                frameMat
            );
            frameLeft.position.set(-dwWidth / 2 + frameThickness / 2, winBottom + winHeight / 2, 0);
            frameLeft.castShadow = true;
            group.add(frameLeft);

            const frameRight = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness, winHeight, wallThickness),
                frameMat
            );
            frameRight.position.set(dwWidth / 2 - frameThickness / 2, winBottom + winHeight / 2, 0);
            frameRight.castShadow = true;
            group.add(frameRight);

            const glassMat = new THREE.MeshStandardMaterial({
                color: 0xc8e6ff,
                roughness: 0.1,
                metalness: 0.0,
                transparent: true,
                opacity: 0.3
            });

            const innerWidth = dwWidth - frameThickness * 2;
            const innerHeight = winHeight - frameThickness * 2;

            if (dw.doorWindowType === 'casement-window') {
                const halfInnerW = innerWidth / 2;

                const leftGlass = new THREE.Mesh(
                    new THREE.BoxGeometry(halfInnerW, innerHeight, 2),
                    glassMat
                );
                leftGlass.position.set(-halfInnerW / 2, winBottom + winHeight / 2, 0);
                group.add(leftGlass);

                const rightGlass = new THREE.Mesh(
                    new THREE.BoxGeometry(halfInnerW, innerHeight, 2),
                    glassMat
                );
                rightGlass.position.set(halfInnerW / 2, winBottom + winHeight / 2, 0);
                group.add(rightGlass);

            } else if (dw.doorWindowType === 'sliding-window') {
                const halfInnerW = innerWidth / 2;

                const glass1 = new THREE.Mesh(
                    new THREE.BoxGeometry(halfInnerW, innerHeight, 2),
                    glassMat
                );
                glass1.position.set(-halfInnerW / 2, winBottom + winHeight / 2, 1.5);
                group.add(glass1);

                const glass2 = new THREE.Mesh(
                    new THREE.BoxGeometry(halfInnerW, innerHeight, 2),
                    glassMat
                );
                glass2.position.set(halfInnerW / 2, winBottom + winHeight / 2, -1.5);
                group.add(glass2);
            }

            const wallBelow = new THREE.Mesh(
                new THREE.BoxGeometry(dwWidth, sillHeight, wallThickness),
                new THREE.MeshStandardMaterial({ color: 0x5a5a6a, roughness: 0.7 })
            );
            wallBelow.position.set(0, -dwHeight / 2 + sillHeight / 2, 0);
            wallBelow.castShadow = true;
            group.add(wallBelow);
        }

        const wallMidX = (wall.x1 + wall.x2) / 2;
        const wallMidY = (wall.y1 + wall.y2) / 2;
        const wallDx = wall.x2 - wall.x1;
        const wallDy = wall.y2 - wall.y1;
        const wallLen = Math.sqrt(wallDx * wallDx + wallDy * wallDy);

        const t = dw.wallT || 0;
        const posX = wall.x1 + t * wallDx;
        const posZ = wall.y1 + t * wallDy;

        group.position.set(posX, dwHeight / 2, posZ);
        group.rotation.y = -Math.atan2(wallDy, wallDx);

        group.userData = { type: 'doorWindow', id: dw.id };
        this.scene.add(group);
        return group;
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
