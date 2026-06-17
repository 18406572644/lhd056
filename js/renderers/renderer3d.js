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
    mouseDownPos: { x: 0, y: 0 },
    dragMoved: false,

    doorWindowStates: new Map(),
    doorWindowAnimations: [],

    raycaster: null,
    mouseVec: null,

    needsUpdate: true,

    init() {
        this.canvas = document.getElementById('canvas-3d');
        this.initThree();
        this.setupEventListeners();
        this.raycaster = new THREE.Raycaster();
        this.mouseVec = new THREE.Vector2();
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

        this.updateDoorWindowAnimations();

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
                this.disposeGroup(mesh);
                this.scene.remove(mesh);
                this.doorWindowMeshes.delete(id);
                this.doorWindowStates.delete(id);
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

    createWoodTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');

        const baseColor = new THREE.Color(color || '#5C3A1E');
        ctx.fillStyle = `#${baseColor.getHexString()}`;
        ctx.fillRect(0, 0, 256, 256);

        for (let i = 0; i < 80; i++) {
            const y = Math.random() * 256;
            const darkness = 0.7 + Math.random() * 0.3;
            const r = Math.floor(baseColor.r * 255 * darkness);
            const g = Math.floor(baseColor.g * 255 * darkness * 0.85);
            const b = Math.floor(baseColor.b * 255 * darkness * 0.6);
            ctx.strokeStyle = `rgb(${r},${g},${b})`;
            ctx.lineWidth = 0.5 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(0, y);
            for (let x = 0; x < 256; x += 10) {
                ctx.lineTo(x, y + (Math.random() - 0.5) * 8);
            }
            ctx.stroke();
        }

        for (let i = 0; i < 20; i++) {
            const y = Math.random() * 256;
            const w = 20 + Math.random() * 60;
            const x = Math.random() * 256;
            const darkness = 0.85 + Math.random() * 0.15;
            const r = Math.floor(baseColor.r * 255 * darkness);
            const g = Math.floor(baseColor.g * 255 * darkness * 0.8);
            const b = Math.floor(baseColor.b * 255 * darkness * 0.5);
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.beginPath();
            ctx.ellipse(x, y, w, 3 + Math.random() * 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
    },

    createDoorWoodMaterial(color) {
        const texture = this.createWoodTexture(color);
        texture.repeat.set(2, 4);
        return new THREE.MeshStandardMaterial({
            map: texture,
            color: color || 0x5C3A1E,
            roughness: 0.65,
            metalness: 0.05
        });
    },

    createGlassMaterial() {
        return new THREE.MeshPhysicalMaterial({
            color: 0xb8e0ff,
            metalness: 0.0,
            roughness: 0.03,
            transmission: 0.95,
            thickness: 1.5,
            ior: 1.5,
            transparent: true,
            opacity: 0.15,
            clearcoat: 1.0,
            clearcoatRoughness: 0.03,
            envMapIntensity: 1.2,
            side: THREE.DoubleSide,
            attenuationColor: new THREE.Color(0xddddff),
            attenuationDistance: 100
        });
    },

    createWindowFrameMaterial(color) {
        return new THREE.MeshStandardMaterial({
            color: color || 0xd0d8e0,
            roughness: 0.35,
            metalness: 0.6
        });
    },

    createMetalHandleMaterial() {
        return new THREE.MeshStandardMaterial({
            color: 0xc9a96a,
            roughness: 0.3,
            metalness: 0.85
        });
    },

    getDoorWindowState(dwId) {
        if (!this.doorWindowStates.has(dwId)) {
            this.doorWindowStates.set(dwId, {
                isOpen: false,
                openProgress: 0,
                targetOpen: 0
            });
        }
        return this.doorWindowStates.get(dwId);
    },

    toggleDoorWindow(dwId) {
        const state = this.getDoorWindowState(dwId);
        state.targetOpen = state.targetOpen > 0.5 ? 0 : 1;
    },

    updateDoorWindowAnimations() {
        for (let i = this.doorWindowAnimations.length - 1; i >= 0; i--) {
            const anim = this.doorWindowAnimations[i];
            anim.currentTime += 16;
            const t = Math.min(1, anim.currentTime / anim.duration);
            const ease = 1 - Math.pow(1 - t, 3);
            anim.update(anim.from + (anim.to - anim.from) * ease);
            if (t >= 1) {
                if (anim.onComplete) anim.onComplete();
                this.doorWindowAnimations.splice(i, 1);
            }
        }

        this.doorWindowMeshes.forEach((group, dwId) => {
            const state = this.doorWindowStates.get(dwId);
            if (!state) return;

            const speed = 0.06;
            if (state.openProgress < state.targetOpen) {
                state.openProgress = Math.min(state.targetOpen, state.openProgress + speed);
            } else if (state.openProgress > state.targetOpen) {
                state.openProgress = Math.max(state.targetOpen, state.openProgress - speed);
            }

            const dw = Store.getObject(dwId);
            if (!dw) return;

            if (dw.category === 'door') {
                this.applyDoorOpenTransform(group, dw, state.openProgress);
            } else {
                this.applyWindowOpenTransform(group, dw, state.openProgress);
            }
        });
    },

    applyDoorOpenTransform(group, dw, progress) {
        const openAngle = progress * Math.PI * 0.55;
        const isDouble = dw.doorWindowType === 'double-door';
        const isSliding = dw.doorWindowType === 'sliding-door';
        const openDir = dw.openDirection || 'left';

        if (isSliding) {
            const shift = progress * (dw.width * 0.45);
            const leftPanel = group.getObjectByName('door-left-panel');
            const rightPanel = group.getObjectByName('door-right-panel');
            if (leftPanel) leftPanel.position.x = -shift;
            if (rightPanel) rightPanel.position.x = shift;
        } else {
            const leftHinge = group.getObjectByName('door-left-hinge');
            const rightHinge = group.getObjectByName('door-right-hinge');

            if (isDouble) {
                if (leftHinge) leftHinge.rotation.y = openAngle;
                if (rightHinge) rightHinge.rotation.y = -openAngle;
            } else {
                const hinge = group.getObjectByName('door-hinge');
                if (hinge) {
                    if (openDir === 'right') {
                        hinge.rotation.y = -openAngle;
                    } else {
                        hinge.rotation.y = openAngle;
                    }
                }
            }
        }
    },

    applyWindowOpenTransform(group, dw, progress) {
        const openAngle = progress * Math.PI * 0.4;
        const isSliding = dw.doorWindowType === 'sliding-window';

        if (isSliding) {
            const shift = progress * (dw.width * 0.4);
            const leftGlass = group.getObjectByName('window-left-glass');
            const rightGlass = group.getObjectByName('window-right-glass');
            if (leftGlass) leftGlass.position.x = -shift;
            if (rightGlass) rightGlass.position.x = shift;
        } else {
            const leftHinge = group.getObjectByName('window-left-hinge');
            const rightHinge = group.getObjectByName('window-right-hinge');
            if (leftHinge) leftHinge.rotation.y = openAngle;
            if (rightHinge) rightHinge.rotation.y = -openAngle;
        }
    },

    handleDoorWindowClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouseVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouseVec, this.camera);

        const doorWindowMeshes = [];
        this.doorWindowMeshes.forEach(group => {
            group.traverse(child => {
                if (child.isMesh && child.userData && child.userData.clickable) {
                    doorWindowMeshes.push(child);
                }
            });
        });

        const intersects = this.raycaster.intersectObjects(doorWindowMeshes, false);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj && !obj.userData.dwId) {
                obj = obj.parent;
            }
            if (obj && obj.userData.dwId) {
                this.toggleDoorWindow(obj.userData.dwId);
                return true;
            }
        }
        return false;
    },

    updateDoorWindowMesh(dw) {
        const hash = this.getDoorWindowHash(dw);
        const existing = this.doorWindowMeshes.get(dw.id);

        if (existing && existing.userData.hash === hash) {
            return;
        }

        if (existing) {
            this.disposeGroup(existing);
            this.scene.remove(existing);
        }

        const state = this.doorWindowStates.get(dw.id);

        const group = this.createDoorWindowMesh(dw);
        if (group) {
            group.userData.hash = hash;
            this.doorWindowMeshes.set(dw.id, group);

            if (state) {
                if (dw.category === 'door') {
                    this.applyDoorOpenTransform(group, dw, state.openProgress);
                } else {
                    this.applyWindowOpenTransform(group, dw, state.openProgress);
                }
            }
        }
    },

    disposeGroup(group) {
        group.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    },

    createDoorWindowMesh(dw) {
        const wall = Store.getObject(dw.wallId);
        if (!wall) return null;

        const dwWidth = dw.width;
        const dwHeight = dw.objectHeight || 210;
        const wallThickness = wall.thickness;
        const wallHeight = wall.wallHeight || Store.defaultWallHeight;
        const isDoor = dw.category === 'door';

        const group = new THREE.Group();
        group.userData = { type: 'doorWindow', id: dw.id, dwId: dw.id };

        if (isDoor) {
            this.createDoorMeshes(group, dw, dwWidth, dwHeight, wallThickness);
        } else {
            this.createWindowMeshes(group, dw, dwWidth, dwHeight, wallThickness, wallHeight);
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

        this.scene.add(group);

        this.getDoorWindowState(dw.id);

        return group;
    },

    createDoorMeshes(group, dw, dwWidth, dwHeight, wallThickness) {
        const frameThickness = 6;
        const frameColor = dw.color || '#5C3A1E';
        const frameMat = this.createDoorWoodMaterial(frameColor);

        const frameTop = new THREE.Mesh(
            new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
            frameMat
        );
        frameTop.position.set(0, dwHeight / 2 - frameThickness / 2, 0);
        frameTop.castShadow = true;
        frameTop.receiveShadow = true;
        group.add(frameTop);

        const frameLeft = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, dwHeight, wallThickness),
            frameMat
        );
        frameLeft.position.set(-dwWidth / 2 + frameThickness / 2, 0, 0);
        frameLeft.castShadow = true;
        frameLeft.receiveShadow = true;
        group.add(frameLeft);

        const frameRight = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, dwHeight, wallThickness),
            frameMat
        );
        frameRight.position.set(dwWidth / 2 - frameThickness / 2, 0, 0);
        frameRight.castShadow = true;
        frameRight.receiveShadow = true;
        group.add(frameRight);

        const doorPanelMat = this.createDoorWoodMaterial(frameColor);
        const handleMat = this.createMetalHandleMaterial();
        const panelThickness = 4;
        const panelHeight = dwHeight - frameThickness * 2;

        if (dw.doorWindowType === 'sliding-door') {
            const panelWidth = (dwWidth - frameThickness * 3) / 2;

            const leftPanel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
                doorPanelMat
            );
            leftPanel.name = 'door-left-panel';
            leftPanel.position.set(-dwWidth / 4, 0, 0);
            leftPanel.castShadow = true;
            leftPanel.receiveShadow = true;
            leftPanel.userData.clickable = true;
            leftPanel.userData.dwId = dw.id;
            group.add(leftPanel);

            const rightPanel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
                doorPanelMat
            );
            rightPanel.name = 'door-right-panel';
            rightPanel.position.set(dwWidth / 4, 0, 0);
            rightPanel.castShadow = true;
            rightPanel.receiveShadow = true;
            rightPanel.userData.clickable = true;
            rightPanel.userData.dwId = dw.id;
            group.add(rightPanel);

            const leftHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 12, 12),
                handleMat
            );
            leftHandle.rotation.x = Math.PI / 2;
            leftHandle.position.set(-dwWidth / 4 + panelWidth / 2 - 8, 0, panelThickness / 2 + 1);
            leftHandle.castShadow = true;
            group.add(leftHandle);

            const rightHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 12, 12),
                handleMat
            );
            rightHandle.rotation.x = Math.PI / 2;
            rightHandle.position.set(dwWidth / 4 - panelWidth / 2 + 8, 0, -panelThickness / 2 - 1);
            rightHandle.castShadow = true;
            group.add(rightHandle);

        } else if (dw.doorWindowType === 'double-door') {
            const panelWidth = (dwWidth - frameThickness * 3) / 2;

            const leftHinge = new THREE.Group();
            leftHinge.name = 'door-left-hinge';
            leftHinge.position.set(-dwWidth / 2 + frameThickness, 0, 0);
            group.add(leftHinge);

            const leftPanel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
                doorPanelMat
            );
            leftPanel.position.set(panelWidth / 2, 0, 0);
            leftPanel.castShadow = true;
            leftPanel.receiveShadow = true;
            leftPanel.userData.clickable = true;
            leftPanel.userData.dwId = dw.id;
            leftHinge.add(leftPanel);

            const leftHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 14, 12),
                handleMat
            );
            leftHandle.rotation.x = Math.PI / 2;
            leftHandle.position.set(panelWidth / 2 + panelWidth - 8, 0, panelThickness / 2 + 1);
            leftHandle.castShadow = true;
            leftHinge.add(leftHandle);

            const rightHinge = new THREE.Group();
            rightHinge.name = 'door-right-hinge';
            rightHinge.position.set(dwWidth / 2 - frameThickness, 0, 0);
            group.add(rightHinge);

            const rightPanel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
                doorPanelMat
            );
            rightPanel.position.set(-panelWidth / 2, 0, 0);
            rightPanel.castShadow = true;
            rightPanel.receiveShadow = true;
            rightPanel.userData.clickable = true;
            rightPanel.userData.dwId = dw.id;
            rightHinge.add(rightPanel);

            const rightHandle = new THREE.Mesh(
                new THREE.CylinderGeometry(1.5, 1.5, 14, 12),
                handleMat
            );
            rightHandle.rotation.x = Math.PI / 2;
            rightHandle.position.set(-panelWidth / 2 - panelWidth + 8, 0, panelThickness / 2 + 1);
            rightHandle.castShadow = true;
            rightHinge.add(rightHandle);

        } else {
            const panelWidth = dwWidth - frameThickness * 2;

            const hinge = new THREE.Group();
            hinge.name = 'door-hinge';
            const openDir = dw.openDirection || 'left';
            const hingeX = openDir === 'right' ? dwWidth / 2 - frameThickness : -dwWidth / 2 + frameThickness;
            hinge.position.set(hingeX, 0, 0);
            group.add(hinge);

            const doorPanel = new THREE.Mesh(
                new THREE.BoxGeometry(panelWidth, panelHeight, panelThickness),
                doorPanelMat
            );
            const panelOffset = openDir === 'right' ? -panelWidth / 2 : panelWidth / 2;
            doorPanel.position.set(panelOffset, 0, 0);
            doorPanel.castShadow = true;
            doorPanel.receiveShadow = true;
            doorPanel.userData.clickable = true;
            doorPanel.userData.dwId = dw.id;
            hinge.add(doorPanel);

            const handleSide = openDir === 'right' ? -1 : 1;
            const handleX = handleSide * (panelWidth / 2 - 10);
            const handle = new THREE.Mesh(
                new THREE.CylinderGeometry(1.8, 1.8, 16, 12),
                handleMat
            );
            handle.rotation.x = Math.PI / 2;
            handle.position.set(handleX, 0, panelThickness / 2 + 2);
            handle.castShadow = true;
            hinge.add(handle);

            const lockPlate = new THREE.Mesh(
                new THREE.CylinderGeometry(2, 2, panelThickness + 2, 12),
                handleMat
            );
            lockPlate.rotation.x = Math.PI / 2;
            lockPlate.position.set(handleSide * (panelWidth / 2 - 1), -15, 0);
            lockPlate.castShadow = true;
            hinge.add(lockPlate);
        }
    },

    createWindowMeshes(group, dw, dwWidth, dwHeight, wallThickness, wallHeight) {
        const frameColor = dw.color || '#d0d8e0';
        const frameMat = this.createWindowFrameMaterial(frameColor);
        const glassMat = this.createGlassMaterial();

        const frameThickness = 5;
        const sillHeight = 90;
        const winHeight = dwHeight - frameThickness * 2;
        const winBottom = sillHeight - dwHeight / 2;
        const winMidY = winBottom + winHeight / 2;

        const frameTop = new THREE.Mesh(
            new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
            frameMat
        );
        frameTop.position.set(0, winBottom + winHeight - frameThickness / 2, 0);
        frameTop.castShadow = true;
        frameTop.receiveShadow = true;
        group.add(frameTop);

        const frameBottom = new THREE.Mesh(
            new THREE.BoxGeometry(dwWidth, frameThickness, wallThickness),
            frameMat
        );
        frameBottom.position.set(0, winBottom + frameThickness / 2, 0);
        frameBottom.castShadow = true;
        frameBottom.receiveShadow = true;
        group.add(frameBottom);

        const frameLeft = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, winHeight, wallThickness),
            frameMat
        );
        frameLeft.position.set(-dwWidth / 2 + frameThickness / 2, winMidY, 0);
        frameLeft.castShadow = true;
        frameLeft.receiveShadow = true;
        group.add(frameLeft);

        const frameRight = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, winHeight, wallThickness),
            frameMat
        );
        frameRight.position.set(dwWidth / 2 - frameThickness / 2, winMidY, 0);
        frameRight.castShadow = true;
        frameRight.receiveShadow = true;
        group.add(frameRight);

        const innerWidth = dwWidth - frameThickness * 2;
        const innerHeight = winHeight - frameThickness * 2;
        const glassThickness = 2;

        if (dw.doorWindowType === 'sliding-window') {
            const halfInnerW = innerWidth / 2;

            const leftGlass = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW - 2, innerHeight - 2, glassThickness),
                glassMat
            );
            leftGlass.name = 'window-left-glass';
            leftGlass.position.set(-halfInnerW / 2, winMidY, wallThickness / 4);
            leftGlass.castShadow = false;
            leftGlass.receiveShadow = true;
            leftGlass.userData.clickable = true;
            leftGlass.userData.dwId = dw.id;
            group.add(leftGlass);

            const leftFrame = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW, innerHeight, wallThickness / 3),
                frameMat
            );
            leftFrame.position.set(-halfInnerW / 2, winMidY, wallThickness / 4);
            leftFrame.castShadow = true;
            group.add(leftFrame);
            leftGlass.position.set(-halfInnerW / 2, winMidY, wallThickness / 4 + 1);

            const rightGlass = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW - 2, innerHeight - 2, glassThickness),
                glassMat
            );
            rightGlass.name = 'window-right-glass';
            rightGlass.position.set(halfInnerW / 2, winMidY, -wallThickness / 4);
            rightGlass.castShadow = false;
            rightGlass.receiveShadow = true;
            rightGlass.userData.clickable = true;
            rightGlass.userData.dwId = dw.id;
            group.add(rightGlass);

            const rightFrame = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW, innerHeight, wallThickness / 3),
                frameMat
            );
            rightFrame.position.set(halfInnerW / 2, winMidY, -wallThickness / 4);
            rightFrame.castShadow = true;
            group.add(rightFrame);
            rightGlass.position.set(halfInnerW / 2, winMidY, -wallThickness / 4 - 1);

            const handleMat = this.createMetalHandleMaterial();
            const leftHandle = new THREE.Mesh(
                new THREE.BoxGeometry(2, 8, wallThickness / 3 + 4),
                handleMat
            );
            leftHandle.position.set(-halfInnerW / 2 + halfInnerW - 4, winMidY, wallThickness / 4);
            group.add(leftHandle);

            const rightHandle = new THREE.Mesh(
                new THREE.BoxGeometry(2, 8, wallThickness / 3 + 4),
                handleMat
            );
            rightHandle.position.set(halfInnerW / 2 - halfInnerW + 4, winMidY, -wallThickness / 4);
            group.add(rightHandle);

        } else {
            const halfInnerW = innerWidth / 2;
            const glassW = halfInnerW - frameThickness / 2;
            const glassH = innerHeight - frameThickness;

            const leftHinge = new THREE.Group();
            leftHinge.name = 'window-left-hinge';
            leftHinge.position.set(-dwWidth / 2 + frameThickness, winMidY, 0);
            group.add(leftHinge);

            const leftFrame = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW, innerHeight, wallThickness / 3),
                frameMat
            );
            leftFrame.position.set(halfInnerW / 2, 0, 0);
            leftFrame.castShadow = true;
            leftHinge.add(leftFrame);

            const leftGlass = new THREE.Mesh(
                new THREE.BoxGeometry(glassW, glassH, glassThickness),
                glassMat
            );
            leftGlass.position.set(halfInnerW / 2, 0, 0);
            leftGlass.castShadow = false;
            leftGlass.receiveShadow = true;
            leftGlass.userData.clickable = true;
            leftGlass.userData.dwId = dw.id;
            leftHinge.add(leftGlass);

            const mullionV = new THREE.Mesh(
                new THREE.BoxGeometry(frameThickness / 2, innerHeight, wallThickness / 3 + 1),
                frameMat
            );
            mullionV.position.set(halfInnerW, 0, 0);
            leftHinge.add(mullionV);

            const rightHinge = new THREE.Group();
            rightHinge.name = 'window-right-hinge';
            rightHinge.position.set(dwWidth / 2 - frameThickness, winMidY, 0);
            group.add(rightHinge);

            const rightFrame = new THREE.Mesh(
                new THREE.BoxGeometry(halfInnerW, innerHeight, wallThickness / 3),
                frameMat
            );
            rightFrame.position.set(-halfInnerW / 2, 0, 0);
            rightFrame.castShadow = true;
            rightHinge.add(rightFrame);

            const rightGlass = new THREE.Mesh(
                new THREE.BoxGeometry(glassW, glassH, glassThickness),
                glassMat
            );
            rightGlass.position.set(-halfInnerW / 2, 0, 0);
            rightGlass.castShadow = false;
            rightGlass.receiveShadow = true;
            rightGlass.userData.clickable = true;
            rightGlass.userData.dwId = dw.id;
            rightHinge.add(rightGlass);

            const handleMat = this.createMetalHandleMaterial();
            const leftLatch = new THREE.Mesh(
                new THREE.BoxGeometry(3, 15, wallThickness / 2 + 2),
                handleMat
            );
            leftLatch.position.set(halfInnerW - 3, 0, wallThickness / 3 + 1);
            leftHinge.add(leftLatch);

            const rightLatch = new THREE.Mesh(
                new THREE.BoxGeometry(3, 15, wallThickness / 2 + 2),
                handleMat
            );
            rightLatch.position.set(-halfInnerW + 3, 0, wallThickness / 3 + 1);
            rightHinge.add(rightLatch);
        }

        const wallBelow = new THREE.Mesh(
            new THREE.BoxGeometry(dwWidth, sillHeight, wallThickness),
            new THREE.MeshStandardMaterial({ color: 0x5a5a6a, roughness: 0.7 })
        );
        wallBelow.position.set(0, -dwHeight / 2 + sillHeight / 2, 0);
        wallBelow.castShadow = true;
        wallBelow.receiveShadow = true;
        group.add(wallBelow);
    },

    setupEventListeners() {
        const canvas = this.canvas;

        canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        canvas.addEventListener('mouseleave', (e) => this.onMouseUp(e));
        canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('click', (e) => this.onClick(e));

        window.addEventListener('resize', () => this.resize());
    },

    onClick(e) {
        if (!Store.is3DMode) return;
        if (this.dragMoved) return;
        this.handleDoorWindowClick(e);
    },

    onMouseDown(e) {
        this.mouseDownPos.x = e.clientX;
        this.mouseDownPos.y = e.clientY;
        this.dragMoved = false;

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

        if (Math.abs(e.clientX - this.mouseDownPos.x) > 3 || Math.abs(e.clientY - this.mouseDownPos.y) > 3) {
            this.dragMoved = true;
        }

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
