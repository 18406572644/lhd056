const WallConnection = {
    SNAP_THRESHOLD: 15,

    getWalls() {
        return Store.getCurrentObjects().filter(obj => obj.type === 'wall');
    },

    getWallEndpoints(wall) {
        return [
            { x: wall.x1, y: wall.y1, endpoint: 'start' },
            { x: wall.x2, y: wall.y2, endpoint: 'end' }
        ];
    },

    getWallMidpoint(wall) {
        return {
            x: (wall.x1 + wall.x2) / 2,
            y: (wall.y1 + wall.y2) / 2
        };
    },

    distance(p1, p2) {
        return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
    },

    pointToLineDistance(px, py, x1, y1, x2, y2) {
        return Collision.pointToLineDistance(px, py, x1, y1, x2, y2);
    },

    getClosestPointOnWall(px, py, wall) {
        const A = px - wall.x1;
        const B = py - wall.y1;
        const C = wall.x2 - wall.x1;
        const D = wall.y2 - wall.y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;

        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) { xx = wall.x1; yy = wall.y1; }
        else if (param > 1) { xx = wall.x2; yy = wall.y2; }
        else { xx = wall.x1 + param * C; yy = wall.y1 + param * D; }

        return {
            x: xx,
            y: yy,
            param: Math.max(0, Math.min(1, param)),
            distance: Math.sqrt(Math.pow(px - xx, 2) + Math.pow(py - yy, 2))
        };
    },

    findNearestWallEndpoint(x, y, excludeWallId = null, threshold = null) {
        const walls = this.getWalls();
        const snapThreshold = threshold || this.SNAP_THRESHOLD;
        let nearest = null;
        let minDist = Infinity;

        walls.forEach(wall => {
            if (wall.id === excludeWallId) return;

            const endpoints = this.getWallEndpoints(wall);
            endpoints.forEach(ep => {
                const dist = this.distance({ x, y }, ep);
                if (dist <= snapThreshold && dist < minDist) {
                    minDist = dist;
                    nearest = {
                        wallId: wall.id,
                        wall: wall,
                        endpoint: ep.endpoint,
                        x: ep.x,
                        y: ep.y,
                        distance: dist,
                        type: 'endpoint'
                    };
                }
            });
        });

        return nearest;
    },

    findNearestWallMidpoint(x, y, excludeWallId = null, threshold = null) {
        const walls = this.getWalls();
        const snapThreshold = threshold || this.SNAP_THRESHOLD;
        let nearest = null;
        let minDist = Infinity;

        walls.forEach(wall => {
            if (wall.id === excludeWallId) return;

            const mid = this.getWallMidpoint(wall);
            const dist = this.distance({ x, y }, mid);
            if (dist <= snapThreshold && dist < minDist) {
                minDist = dist;
                nearest = {
                    wallId: wall.id,
                    wall: wall,
                    x: mid.x,
                    y: mid.y,
                    distance: dist,
                    type: 'midpoint'
                };
            }
        });

        return nearest;
    },

    findNearestWallPoint(x, y, excludeWallId = null, threshold = null) {
        const walls = this.getWalls();
        const snapThreshold = threshold || this.SNAP_THRESHOLD;
        let nearest = null;
        let minDist = Infinity;

        walls.forEach(wall => {
            if (wall.id === excludeWallId) return;

            const closest = this.getClosestPointOnWall(x, y, wall);
            if (closest.distance <= snapThreshold && closest.distance < minDist) {
                minDist = closest.distance;
                nearest = {
                    wallId: wall.id,
                    wall: wall,
                    x: closest.x,
                    y: closest.y,
                    param: closest.param,
                    distance: closest.distance,
                    type: 'wallpoint'
                };
            }
        });

        return nearest;
    },

    snapToWallFeature(x, y, excludeWallId = null, threshold = null) {
        const snapThreshold = threshold || this.SNAP_THRESHOLD;

        const endpointSnap = this.findNearestWallEndpoint(x, y, excludeWallId, snapThreshold);
        if (endpointSnap) {
            return endpointSnap;
        }

        const midpointSnap = this.findNearestWallMidpoint(x, y, excludeWallId, snapThreshold);
        if (midpointSnap) {
            return midpointSnap;
        }

        const wallpointSnap = this.findNearestWallPoint(x, y, excludeWallId, snapThreshold);
        if (wallpointSnap) {
            return wallpointSnap;
        }

        return null;
    },

    getWallConnections(wall) {
        return {
            start: wall.startConnection || null,
            end: wall.endConnection || null
        };
    },

    setWallConnection(wall, endpoint, connection) {
        if (endpoint === 'start') {
            if (connection) {
                wall.startConnection = connection;
            } else {
                delete wall.startConnection;
            }
        } else {
            if (connection) {
                wall.endConnection = connection;
            } else {
                delete wall.endConnection;
            }
        }
    },

    updateWallConnections(wall) {
        const walls = this.getWalls();
        const threshold = this.SNAP_THRESHOLD;

        this.setWallConnection(wall, 'start', null);
        this.setWallConnection(wall, 'end', null);

        const endpoints = this.getWallEndpoints(wall);

        endpoints.forEach(ep => {
            let bestConnection = null;
            let bestDist = Infinity;

            walls.forEach(otherWall => {
                if (otherWall.id === wall.id) return;

                const otherEndpoints = this.getWallEndpoints(otherWall);
                otherEndpoints.forEach(otherEp => {
                    const dist = this.distance(ep, otherEp);
                    if (dist <= threshold && dist < bestDist) {
                        bestDist = dist;
                        bestConnection = {
                            type: 'endpoint',
                            wallId: otherWall.id,
                            otherEndpoint: otherEp.endpoint
                        };
                    }
                });

                const closest = this.getClosestPointOnWall(ep.x, ep.y, otherWall);
                if (closest.distance <= threshold && closest.distance < bestDist &&
                    closest.param > 0.05 && closest.param < 0.95) {
                    bestDist = closest.distance;
                    bestConnection = {
                        type: 't-junction',
                        wallId: otherWall.id,
                        param: closest.param,
                        pointX: closest.x,
                        pointY: closest.y
                    };
                }
            });

            if (bestConnection) {
                this.setWallConnection(wall, ep.endpoint, bestConnection);

                if (bestConnection.type === 'endpoint') {
                    const otherWall = Store.getObject(bestConnection.wallId);
                    if (otherWall) {
                        const reverseConn = {
                            type: 'endpoint',
                            wallId: wall.id,
                            otherEndpoint: ep.endpoint
                        };
                        this.setWallConnection(otherWall, bestConnection.otherEndpoint, reverseConn);
                    }
                }
            }
        });
    },

    updateAllWallConnections() {
        const walls = this.getWalls();

        walls.forEach(wall => {
            this.setWallConnection(wall, 'start', null);
            this.setWallConnection(wall, 'end', null);
        });

        walls.forEach(wall => {
            this.updateWallConnections(wall);
        });
    },

    moveWallEndpoint(wallId, endpoint, newX, newY, moveConnected = true) {
        const wall = Store.getObject(wallId);
        if (!wall || wall.type !== 'wall') return;

        const oldX = endpoint === 'start' ? wall.x1 : wall.x2;
        const oldY = endpoint === 'start' ? wall.y1 : wall.y2;

        if (oldX === newX && oldY === newY) return;

        if (endpoint === 'start') {
            wall.x1 = newX;
            wall.y1 = newY;
        } else {
            wall.x2 = newX;
            wall.y2 = newY;
        }

        if (!moveConnected) {
            this.updateWallConnections(wall);
            return;
        }

        const connKey = endpoint === 'start' ? 'startConnection' : 'endConnection';
        const connection = wall[connKey];

        if (connection && connection.type === 'endpoint') {
            const otherWall = Store.getObject(connection.wallId);
            if (otherWall) {
                const otherEndpoint = connection.otherEndpoint;
                if (otherEndpoint === 'start') {
                    otherWall.x1 = newX;
                    otherWall.y1 = newY;
                } else {
                    otherWall.x2 = newX;
                    otherWall.y2 = newY;
                }
                this.propagateWallMove(otherWall.id, otherEndpoint, wallId);
            }
        }

        this.updateWallConnections(wall);
        Store.updateAttachedDoorWindows(wall);
    },

    propagateWallMove(wallId, movedEndpoint, fromWallId) {
        const wall = Store.getObject(wallId);
        if (!wall || wall.type !== 'wall') return;

        const otherEndpoint = movedEndpoint === 'start' ? 'end' : 'start';
        const connKey = otherEndpoint === 'start' ? 'startConnection' : 'endConnection';
        const connection = wall[connKey];

        if (connection && connection.type === 'endpoint' && connection.wallId !== fromWallId) {
            const otherWall = Store.getObject(connection.wallId);
            if (otherWall) {
                const newX = otherEndpoint === 'start' ? wall.x1 : wall.x2;
                const newY = otherEndpoint === 'start' ? wall.y1 : wall.y2;
                const otherEp = connection.otherEndpoint;

                if (otherEp === 'start') {
                    otherWall.x1 = newX;
                    otherWall.y1 = newY;
                } else {
                    otherWall.x2 = newX;
                    otherWall.y2 = newY;
                }

                this.propagateWallMove(otherWall.id, otherEp, wallId);
            }
        }

        if (connection && connection.type === 't-junction') {
            const otherWall = Store.getObject(connection.wallId);
            if (otherWall) {
                const closest = this.getClosestPointOnWall(
                    otherEndpoint === 'start' ? wall.x1 : wall.x2,
                    otherEndpoint === 'start' ? wall.y1 : wall.y2,
                    otherWall
                );
                connection.param = closest.param;
                connection.pointX = closest.x;
                connection.pointY = closest.y;
            }
        }
    },

    getWallJunctionType(wall, endpoint) {
        const connKey = endpoint === 'start' ? 'startConnection' : 'endConnection';
        const connection = wall[connKey];

        if (!connection) return 'free';

        if (connection.type === 't-junction') return 't-junction';

        if (connection.type === 'endpoint') {
            const otherWall = Store.getObject(connection.wallId);
            if (!otherWall) return 'corner';

            const otherConnKey = connection.otherEndpoint === 'start' ? 'startConnection' : 'endConnection';
            const otherConnection = otherWall[otherConnKey];

            let connectedCount = 1;

            if (otherConnection && otherConnection.type === 'endpoint') {
                connectedCount++;
            }

            const walls = this.getWalls();
            walls.forEach(w => {
                if (w.id === wall.id || w.id === otherWall.id) return;

                const checkEndpoint = (ep) => {
                    const epConnKey = ep === 'start' ? 'startConnection' : 'endConnection';
                    const wConn = w[epConnKey];
                    if (wConn && wConn.type === 'endpoint') {
                        const epX = ep === 'start' ? w.x1 : w.x2;
                        const epY = ep === 'start' ? w.y1 : w.y2;
                        const juncX = endpoint === 'start' ? wall.x1 : wall.x2;
                        const juncY = endpoint === 'start' ? wall.y1 : wall.y2;
                        if (this.distance({ x: epX, y: epY }, { x: juncX, y: juncY }) <= this.SNAP_THRESHOLD) {
                            connectedCount++;
                        }
                    } else if (wConn && wConn.type === 't-junction') {
                        const juncX = endpoint === 'start' ? wall.x1 : wall.x2;
                        const juncY = endpoint === 'start' ? wall.y1 : wall.y2;
                        if (this.distance({ x: wConn.pointX, y: wConn.pointY }, { x: juncX, y: juncY }) <= this.SNAP_THRESHOLD) {
                            connectedCount++;
                        }
                    }
                };
                checkEndpoint('start');
                checkEndpoint('end');
            });

            if (connectedCount >= 4) return 'cross';
            if (connectedCount >= 3) return 't-junction';
            return 'corner';
        }

        return 'free';
    },

    getJunctionsAtPoint(x, y) {
        const junctions = [];
        const walls = this.getWalls();

        walls.forEach(wall => {
            ['start', 'end'].forEach(ep => {
                const epX = ep === 'start' ? wall.x1 : wall.x2;
                const epY = ep === 'start' ? wall.y1 : wall.y2;
                if (this.distance({ x, y }, { x: epX, y: epY }) <= this.SNAP_THRESHOLD) {
                    junctions.push({
                        wallId: wall.id,
                        endpoint: ep,
                        type: 'endpoint'
                    });
                }
            });

            const connKeys = ['startConnection', 'endConnection'];
            connKeys.forEach(connKey => {
                const conn = wall[connKey];
                if (conn && conn.type === 't-junction') {
                    if (this.distance({ x, y }, { x: conn.pointX, y: conn.pointY }) <= this.SNAP_THRESHOLD) {
                        const ep = connKey === 'startConnection' ? 'start' : 'end';
                        junctions.push({
                            wallId: wall.id,
                            endpoint: ep,
                            type: 't-junction',
                            otherWallId: conn.wallId
                        });
                    }
                }
            });
        });

        return junctions;
    },

    handleWallDeletion(wallId) {
        const walls = this.getWalls();
        const deletedWall = Store.getObject(wallId);
        if (!deletedWall) return;

        const results = {
            fixedWalls: [],
            removedConnections: 0
        };

        walls.forEach(wall => {
            if (wall.id === wallId) return;

            let updated = false;

            ['startConnection', 'endConnection'].forEach(connKey => {
                const conn = wall[connKey];
                if (conn && conn.wallId === wallId) {
                    delete wall[connKey];
                    results.removedConnections++;
                    updated = true;
                }
            });

            if (updated) {
                results.fixedWalls.push(wall.id);
            }
        });

        return results;
    },

    getWallEndpointScreenPosition(wall, endpoint) {
        const x = endpoint === 'start' ? wall.x1 : wall.x2;
        const y = endpoint === 'start' ? wall.y1 : wall.y2;
        return Coordinates.worldToScreen(x, y);
    },

    hitTestWallEndpoint(screenX, screenY, wall, endpoint, handleSize = 8) {
        const pos = this.getWallEndpointScreenPosition(wall, endpoint);
        const dx = screenX - pos.x;
        const dy = screenY - pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= handleSize;
    },

    getWallEndpointAtScreenPoint(screenX, screenY, handleSize = 8) {
        const walls = this.getWalls();
        const world = Coordinates.screenToWorld(screenX, screenY);

        for (let i = walls.length - 1; i >= 0; i--) {
            const wall = walls[i];
            for (const endpoint of ['start', 'end']) {
                if (this.hitTestWallEndpoint(screenX, screenY, wall, endpoint, handleSize)) {
                    return {
                        wallId: wall.id,
                        wall: wall,
                        endpoint: endpoint,
                        worldX: endpoint === 'start' ? wall.x1 : wall.x2,
                        worldY: endpoint === 'start' ? wall.y1 : wall.y2,
                        screenX: screenX,
                        screenY: screenY
                    };
                }
            }
        }
        return null;
    },

    findAllWallIntersections() {
        const walls = this.getWalls();
        const intersections = [];

        for (let i = 0; i < walls.length; i++) {
            for (let j = i + 1; j < walls.length; j++) {
                const wall1 = walls[i];
                const wall2 = walls[j];

                const intersection = Collision.lineIntersection(
                    wall1.x1, wall1.y1, wall1.x2, wall1.y2,
                    wall2.x1, wall2.y1, wall2.x2, wall2.y2
                );

                if (intersection) {
                    const isEndpoint1 = intersection.t < 0.02 || intersection.t > 0.98;
                    const isEndpoint2 = intersection.u < 0.02 || intersection.u > 0.98;

                    if (!isEndpoint1 && !isEndpoint2) {
                        intersections.push({
                            x: intersection.x,
                            y: intersection.y,
                            wall1Id: wall1.id,
                            wall2Id: wall2.id,
                            wall1: wall1,
                            wall2: wall2,
                            t1: intersection.t,
                            t2: intersection.u,
                            type: 'cross'
                        });
                    }
                }
            }
        }

        return intersections;
    },

    getWallIntersections(wallId) {
        const allIntersections = this.findAllWallIntersections();
        return allIntersections.filter(i => i.wall1Id === wallId || i.wall2Id === wallId);
    }
};
