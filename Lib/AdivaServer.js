class SpatialGrid {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.staticGrid = {};
        this.dynamicGrid = {};
    }

    getCellKey(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return `${cx},${cy}`;
    }

    buildStatic(...groups) {
        this.staticGrid = {};

        for (const group of groups) {
            if (!group) continue;

            for (let id in group) {
                const g = group[id];
                if (!g) continue;

                const key = this.getCellKey(g.x, g.y);
                (this.staticGrid[key] ??= []).push(g);
                g._cellKey = key;
            }
        }
    }
    updateStaticObject(g) {
        const newKey = this.getCellKey(g.x, g.y);

        if (g._cellKey === newKey) return;

        // Hapus dari cell lama
        if (g._cellKey && this.staticGrid[g._cellKey]) {
            const arr = this.staticGrid[g._cellKey];
            const index = arr.indexOf(g);
            if (index !== -1) arr.splice(index, 1);
        }

        // Masukkan ke cell baru
        (this.staticGrid[newKey] ??= []).push(g);

        g._cellKey = newKey;
    }
    removeStaticObject(g) {
        if (!g._cellKey) return;

        const cell = this.staticGrid[g._cellKey];
        if (!cell) return;

        const index = cell.indexOf(g);
        if (index !== -1) cell.splice(index, 1);

        // kalau cell kosong, hapus key biar bersih
        if (cell.length === 0) {
            delete this.staticGrid[g._cellKey];
        }

        g._cellKey = null;
    }
    buildDynamic(...groups) {
        this.dynamicGrid = {};

        for (const group of groups) {
            if (!group) continue;

            for (let id in group) {
                const g = group[id];
                if (!g) continue;

                const key = this.getCellKey(g.x, g.y);
                (this.dynamicGrid[key] ??= []).push(g);
            }
        }
    }
    buildDynamicType(...groups) {
        this.dynamicGrid = {};

        for (const group of groups) {
            if (!group) continue;

            for (let id in group) {
                const g = group[id];
                if (!g || !g.type) continue;

                const key = this.getCellKey(g.x, g.y);

                this.dynamicGrid[key] ??= {};
                (this.dynamicGrid[key][g.type] ??= []).push(g);
            }
        }
    }

    getNearby(x, y, width, height) {
        const minCellX = Math.floor(x / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);

        const minCellY = Math.floor(y / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);

        const result = [];

        for (let gx = minCellX - 1; gx <= maxCellX + 1; gx++) {
            for (let gy = minCellY - 1; gy <= maxCellY + 1; gy++) {
                const key = `${gx},${gy}`;

                if (this.staticGrid[key]) result.push(...this.staticGrid[key]);

                if (this.dynamicGrid[key])
                    result.push(...this.dynamicGrid[key]);
            }
        }

        return result;
    }
    getNearbyStatic(x, y, width, height) {
        const minCellX = Math.floor(x / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);

        const minCellY = Math.floor(y / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);

        const result = [];

        for (let gx = minCellX - 1; gx <= maxCellX + 1; gx++) {
            for (let gy = minCellY - 1; gy <= maxCellY + 1; gy++) {
                const key = `${gx},${gy}`;

                if (this.staticGrid[key]) {
                    result.push(...this.staticGrid[key]);
                }
            }
        }

        return result;
    }
    getNearbyByType(x, y, width, height, type) {
        const minCellX = Math.floor(x / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);

        const minCellY = Math.floor(y / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);

        const result = [];

        for (let gx = minCellX - 1; gx <= maxCellX + 1; gx++) {
            for (let gy = minCellY - 1; gy <= maxCellY + 1; gy++) {
                const key = `${gx},${gy}`;
                const cell = this.dynamicGrid[key];

                if (!cell) continue;

                const typed = cell[type];
                if (!typed) continue;

                for (let i = 0; i < typed.length; i++) {
                    result.push(typed[i]);
                }
            }
        }

        return result;
    }
    getNearbyAll(x, y, width, height) {
        const minCellX = Math.floor(x / this.cellSize);
        const maxCellX = Math.floor((x + width) / this.cellSize);

        const minCellY = Math.floor(y / this.cellSize);
        const maxCellY = Math.floor((y + height) / this.cellSize);

        const result = [];

        for (let gx = minCellX - 1; gx <= maxCellX + 1; gx++) {
            for (let gy = minCellY - 1; gy <= maxCellY + 1; gy++) {
                const key = `${gx},${gy}`;

                if (this.staticGrid[key]) {
                    result.push(...this.staticGrid[key]);
                }

                if (this.dynamicGrid[key]) {
                    result.push(...this.dynamicGrid[key]);
                }
            }
        }

        return result;
    }
}
class Collision {
    constructor(cellSize = 100) {
        this.grid = new SpatialGrid(cellSize);
        this.gameState = new Set();
    }

    // ==============================
    // AABB CORE
    // ==============================

    checkAABB(px, py, pw, ph, tx, ty, tw, th) {
        return px < tx + tw && px + pw > tx && py < ty + th && py + ph > ty;
    }
    check(g1, g2) {
        if (!this.gameState.has(g1.scene)) return;
        if (!this.gameState.has(g2.scene)) return;
        return (
            g1.x < g2.x + g2.width &&
            g1.x + g1.width > g2.x &&
            g1.y < g2.y + g2.height &&
            g1.y + g1.height > g2.y
        );
    }

    // ==============================
    // GROUP vs GROUP AABB
    // ==============================

    aabb(group1 = {}, type, onCollide) {
        for (let id in group1) {
            const original1 = group1[id]; // objek asli
            let g1 = original1;

            if (g1.useHurtBox && g1.hurtBox) g1 = g1.hurtBox;

            const nearby = this.grid.getNearbyAll(
                g1.x,
                g1.y,
                g1.width,
                g1.height
            );

            for (let i = 0; i < nearby.length; i++) {
                const original2 = nearby[i];
                let g2 = original2;

                if (g2.type !== type) continue;
                if (!this.gameState.has(g2.scene)) continue;

                if (g2.useHurtBox && g2.hurtBox) g2 = g2.hurtBox;

                if (
                    this.checkAABB(
                        g1.x,
                        g1.y,
                        g1.width,
                        g1.height,
                        g2.x,
                        g2.y,
                        g2.width,
                        g2.height
                    )
                ) {
                    if (onCollide) onCollide(original1, original2);
                }
            }
        }
    }

    // ==============================
    // SIMPLE MOVE WITH COLLISION
    // ==============================

    moveWithCollision(player, dx, dy) {
        // ===== X =====
        let nextX = player.x + dx;
        let nearbyX = this.grid.getNearbyAll(
            nextX,
            player.y,
            player.width,
            player.height
        );

        for (let o of nearbyX) {
            if (
                this.checkAABB(
                    nextX,
                    player.y,
                    player.width,
                    player.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (dx > 0) nextX = o.x - player.width;
                if (dx < 0) nextX = o.x + o.width;
                dx = 0;
            }
        }

        player.x = nextX;

        // ===== Y =====
        let nextY = player.y + dy;
        let nearbyY = this.grid.getNearbyAll(
            player.x,
            nextY,
            player.width,
            player.height
        );

        for (let o of nearbyY) {
            if (
                this.checkAABB(
                    player.x,
                    nextY,
                    player.width,
                    player.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (dy > 0) nextY = o.y - player.height;
                if (dy < 0) nextY = o.y + o.height;
                dy = 0;
            }
        }

        player.y = nextY;
    }

    // ==============================
    // PHYSICS (TIDAK DIUBAH)
    // ==============================

    checkHorizontal(entity, dt = 1) {
        let nextX = entity.x + entity.vx * dt;

        entity.onWall = false;
        entity.wallSide = null;

        // pakai colliderBox
        entity.colliderBox ??= {};
        const box =
            entity.useCollider && entity.colliderBox
                ? {
                      x:
                          entity.x +
                          entity.width / 2 -
                          entity.colliderBox.width / 2,
                      y:
                          entity.y +
                          entity.height / 2 -
                          entity.colliderBox.height / 2,
                      width: entity.colliderBox.width,
                      height: entity.colliderBox.height,
                      scene: entity.colliderBox.scene
                  }
                : { ...entity };

        // geser sesuai vx
        box.x += entity.vx * dt;

        const nearby = this.grid.getNearbyStatic(
            box.x,
            box.y,
            box.width,
            box.height
        );

        for (let o of nearby) {
            if (!this.gameState.has(o.scene)) continue;

            if (
                this.checkAABB(
                    box.x,
                    box.y,
                    box.width,
                    box.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (entity.vx > 0) {
                    nextX =
                        o.x - entity.colliderBox.width / 2 - entity.width / 2;
                    entity.wallSide = "right";
                } else if (entity.vx < 0) {
                    nextX =
                        o.x +
                        o.width -
                        entity.width / 2 +
                        entity.colliderBox.width / 2;
                    entity.wallSide = "left";
                }
                entity.vx = 0;
                entity.onWall = true;
                break;
            }
        }

        entity.x = nextX;
    }

    checkVertical(entity, dt = 1) {
        let nextY = entity.y + entity.vy * dt;

        entity.onGround = false;
        entity.groundObject = null;

        entity.colliderBox ??= {};
        const box =
            entity.useCollider && entity.colliderBox
                ? {
                      x:
                          entity.x +
                          entity.width / 2 -
                          entity.colliderBox.width / 2,
                      y:
                          entity.y +
                          entity.height / 2 -
                          entity.colliderBox.height / 2,
                      width: entity.colliderBox.width,
                      height: entity.colliderBox.height,
                      scene: entity.colliderBox.scene
                  }
                : { ...entity };

        box.y += entity.vy * dt;

        const nearby = this.grid.getNearbyStatic(
            box.x,
            box.y,
            box.width,
            box.height
        );

        for (let o of nearby) {
            if (!this.gameState.has(o.scene)) continue;

            if (
                this.checkAABB(
                    box.x,
                    box.y,
                    box.width,
                    box.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (entity.vy > 0) {
                    nextY =
                        o.y - entity.colliderBox.height / 2 - entity.height / 2;
                    entity.onGround = true;
                    entity.groundObject = o;
                } else if (entity.vy < 0) {
                    nextY =
                        o.y +
                        o.height -
                        entity.height / 2 +
                        entity.colliderBox.height / 2;
                }
                entity.vy = 0;
                break;
            }
        }

        entity.y = nextY;
    }

    applyPhysics(dt, player) {
        // this.grid.buildDynamic(dynamicObstacles);

        this.checkHorizontal(player, dt);
        this.checkVertical(player, dt);
    }
    platformerLogic(dt, player) {
        // ================= SET DEFAULT =================
        player.vx ??= 0;
        player.vy ??= 0;
        player.gravity ??= 900;
        player.friction ??= 0.85;
        player.airFriction ??= 0.98;
        player.onGround ??= false;
        player.onWall ??= false;
        player.onSide ??= false;
        player.state ??= "idle";
        player.superState ??= 0;
        player.animationDirection ??= "right";
        player.img ??= "diam";

        player.visual ??= { width: 120, height: 120 };
        // player.useHurtBox ??= true;
        // player.hurtBox ??= { x: 0, y: 0, width: 40, height: 80, scene: "play", color: "red" };
        player.jumpBufferTimer ??= 0;
        player.jumpBufferMax ??= 0.15;
        player.coyoteTimer ??= 0;
        player.coyoteMax ??= 0.2;
        player.jumpCount ??= 0;
        player.maxJump ??= 2;
        player.jumpPower ??= 450;

        // ================= UPDATE STATE =================
        if (!player.superState) {
            if (!player.onGround) {
                player.state = player.vy < 0 ? "jump" : "fall";
            } else if (Math.abs(player.vx) > 10) {
                player.state = "run";
            } else {
                player.state = "idle";
            }
        }

        if (player.onGround) {
            player.coyoteTimer = player.coyoteMax;
            player.jumpCount = 0;
        } else {
            player.coyoteTimer = Math.max(player.coyoteTimer - dt, 0);
        }

        if (player.jumpBufferTimer > 0) {
            player.jumpBufferTimer = Math.max(player.jumpBufferTimer - dt, 0);

            if (player.coyoteTimer > 0) {
                player.vy = -player.jumpPower;
                player.jumpCount = 1;
                player.coyoteTimer = 0;
                player.jumpBufferTimer = 0;
            } else if (
                player.jumpCount > 0 &&
                player.jumpCount < player.maxJump
            ) {
                player.vy = -player.jumpPower;
                player.jumpCount++;
                player.jumpBufferTimer = 0;
            }
        }

        // ================= PLATFORM MOVE =================
        if (player.onGround && player.groundObject) {
            if (player.groundObject.vx) player.x += player.groundObject.vx * dt;
            if (player.groundObject.vy) player.y += player.groundObject.vy * dt;
        }

        // ================= HURTBOX =================
        /*  player.hurtBox.x =
            player.x + player.width / 2 - player.hurtBox.width / 2;
        player.hurtBox.y =
            player.y + player.height / 2 - player.hurtBox.height / 2;*/
    }
    applyPhysics2(player, walls = {}, dt = 1) {
        player.vy += player.gravity * dt;

        player.onGround = false;
        player.onWall = false;
        player.wallSide = null;
        player.groundObject = null;

        // ===== X AXIS =====
        let nextX = player.x + player.vx * dt;

        for (let id in walls) {
            let o = walls[id];

            if (!this.gameState.has(o.scene)) continue;

            if (
                this.checkAABB(
                    nextX,
                    player.y,
                    player.width,
                    player.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (player.vx > 0) {
                    nextX = o.x - player.width;
                    player.wallSide = "right";
                } else if (player.vx < 0) {
                    nextX = o.x + o.width;
                    player.wallSide = "left";
                }

                player.vx = 0;
                player.onWall = true;
            }
        }

        player.x = nextX;

        // ===== Y AXIS =====
        let nextY = player.y + player.vy * dt;

        for (let id in walls) {
            let o = walls[id];

            if (!this.gameState.has(o.scene)) continue;

            if (
                this.checkAABB(
                    player.x,
                    nextY,
                    player.width,
                    player.height,
                    o.x,
                    o.y,
                    o.width,
                    o.height
                )
            ) {
                if (player.vy > 0) {
                    nextY = o.y - player.height;
                    player.onGround = true;
                    player.groundObject = o;
                } else if (player.vy < 0) {
                    nextY = o.y + o.height;
                }

                player.vy = 0;
            }
        }

        player.y = nextY;
    }

    applySpeedPlatformerByAnalog(p, anal) {
        p.vx = anal.dx * p.speed;

        if (anal.dx < 0) p.animationDirection = "left";
        else if (anal.dx > 0) p.animationDirection = "right";
    }
}

class AI_System {
    constructor() {
        this.gameState = new Set();
    }
    move(players, deltaTime, cb = () => {}) {
        for (let id in players) {
            const el = players[id];
            if (!el.isAI_Move) continue;
            if (!this.gameState.has(el.scene)) continue;

            el.AI_Step ??= 1;
            el.__aiTime ??= 0;

            const move = el.AI_Move[el.AI_Step];
            cb(el, move);

            if (!move) {
                el.AI_Step = 1;
                el.__aiTime = 0;
                continue;
            }

            if (el.stopDuration <= 0) {
                el.stop = false;
            }
            if (el.stop && el.stopDuration) {
                el.stopDuration -= deltaTime;
                continue;
            }
            el.__aiTime += deltaTime;

            if (move.pos) {
                el.x += move.pos.x * deltaTime;
                el.y += move.pos.y * deltaTime;
            }

            if (move.animDir !== undefined) {
                el.animationDirection = move.animDir;
            }

            if (move.ability !== undefined) {
                el.ability = move.ability;
            }

            if (el.__aiTime >= move.duration) {
                el.__aiTime = 0;
                el.AI_Step++;

                if (!el.AI_Move[el.AI_Step]) {
                    el.AI_Step = 1;
                }
            }
        }
    }
}
class Utils {
    resetOriginal(e) {
        e.scene = e.originalScene;
        e.x = e.originalX;
        e.y = e.originalY;
        e.width = e.originalWidth;
        e.height = e.originalHeight;
        e.hp = e.originalHp;
    }
    createGrid(grid = 80, x = 0, y = 0, map = []) {
    const walls = {};
    let col = 0;

    // cek apakah map mengandung string
    const hasString = map.some(v => typeof v === "string");

    for (let i = 0; i < map.length; i++) {
        let val = map[i];

        // jika ada string di map → semua number dianggap 0
        if (hasString && typeof val === "number") {
            val = 0;
        }

        const offsetX = x + col * grid;
        let offsetY = y;

        if (val !== 0) {
            if (val === 1) {
                offsetY = y;
            } 
            else if (val < 0) {
                offsetY = y + val * grid;
            } 
            else if (val > 1) {
                offsetY = y + (val - 1) * grid;
            }

            const id = crypto.randomUUID();

            walls[id] = {
                x: offsetX,
                y: offsetY,
                width: grid,
                height: grid
            };
        }

        col++;
    }

    // helper chain
    const apply = (prop, value) => {
        for (const k in walls) {
            if (typeof walls[k] === "object") {
                walls[k][prop] = value;
            }
        }
        return walls;
    };

    // ===== CHAIN METHODS =====

    Object.defineProperty(walls, "scene", {
        value(name) {
            return apply("scene", name);
        },
        enumerable: false
    });

    Object.defineProperty(walls, "img", {
        value(name) {
            return apply("img", name);
        },
        enumerable: false
    });

    Object.defineProperty(walls, "type", {
        value(name) {
            return apply("type", name);
        },
        enumerable: false
    });

    return walls;
}
    merge(target, source) {
        for (let key in source) {
            target[key] = source[key];
        }
    }
    check(data, app) {
        app.divText(
            Object.values(data).filter(d => d.scene !== "inactive").length
        );
    }
    activeHurtBox(target) {
        target.hurtBox.x =
            target.x + target.width / 2 - target.hurtBox.width / 2;
        target.hurtBox.y =
            target.y + target.height / 2 - target.hurtBox.height / 2;
    }
    comPos(target, tujuan) {
        target.x = tujuan.x + tujuan.width / 2 - target.width / 2;
        target.y = tujuan.y + tujuan.height / 2 - target.height / 2;
    }
    timer(dt, id, interval, callback = () => {}) {
        this._timers ??= {};

        const key = `spawn ${id}`;
        if (!this._timers[key]) {
            this._timers[key] = { waktu: 0 };
        }

        const timer = this._timers[key];

        timer.waktu += dt;

        if (timer.waktu >= interval) {
            callback();
            timer.waktu = 0;
        }
    }
    splitTime(dt, key, str, callback = () => {}) {
        this.yourTime ??= {};
        if (!this.yourTime[key]) {
            this.yourTime[key] = {};
        }
        const t = this.yourTime[key];
        if (t[`timer1`] !== undefined) {
            let idx = t.now;
            t[`timer${idx}`] -= dt ?? 1 / 60;

            callback({
                [`timer${idx}`]: true,
                sisa: t[`timer${idx}`]
            });

            if (t[`timer${idx}`] <= 0) {
                t[`timer${idx}`] = 0;
                t.now++;
                if (t.now > t.total) {
                    t.now = 1;
                    for (let i = 0; i < t.timeAsli.length; i++) {
                        t[`timer${i + 1}`] = t.timeAsli[i];
                    }
                }
            }
            return;
        }
        const arrTime = str.split(" ").map(Number);
        const obj = {};
        for (let i = 0; i < arrTime.length; i++) {
            obj[`timer${i + 1}`] = arrTime[i];
        }
        obj.now = 1;
        obj.timeAsli = arrTime;
        obj.total = arrTime.length;
        this.yourTime[key] = obj;
    }

    checkDistance(group1, group2, threshold, cb) {
        for (let id1 in group1) {
            const obj1 = group1[id1];
            for (let id2 in group2) {
                const obj2 = group2[id2];
                const dx = obj2.x - obj1.x;
                const dy = obj2.y - obj1.y;
                const dist = Math.hypot(dx, dy);
                if (dist <= threshold) {
                    cb(obj1, obj2, dist);
                }
            }
        }
    }

    checkDX(group1, group2, threshold, cb) {
        for (let id1 in group1) {
            const obj1 = group1[id1];
            for (let id2 in group2) {
                const obj2 = group2[id2];
                const dx = obj2.x - obj1.x;
                if (Math.abs(dx) <= threshold) cb(obj1, obj2, dx);
            }
        }
    }

    checkDY(group1, group2, threshold, cb) {
        for (let id1 in group1) {
            const obj1 = group1[id1];
            for (let id2 in group2) {
                const obj2 = group2[id2];
                const dy = obj2.y - obj1.y;
                if (Math.abs(dy) <= threshold) cb(obj1, obj2, dy);
            }
        }
    }

    fixAnalog(dx, dy) {
        const len = Math.hypot(dx, dy);
        if (len > 0) {
            dx /= len;
            dy /= len;
        }
        return { dx, dy };
    }

    randId() {
        return Date.now() + "_" + Math.floor(Math.random() * 1000);
    }

    rand(min = 0, max = 0) {
        if (min === 0 && max === 0) return 0;
        if (min === max) return min;

        let number;
        let guard = 10;
        do {
            number = Math.floor(Math.random() * (max - min + 1)) + min;
        } while (number === 0 && guard-- > 0);

        return number === 0 ? min : number;
    }

    read(obj, cb) {
        for (let id in obj) {
            const el = obj[id];
            cb(el, id);
            if (el.delThis) delete obj[id];
        }
    }

    getSafePosition(cfg = {}) {
        const {
            avoid,
            width,
            height,
            worldWidth = 300,
            worldHeight = 600,
            worldX = 0,
            worldY = 0
        } = cfg;
        let x, y, safe;
        do {
            x = this.rand(worldX, worldWidth);
            y = this.rand(worldY, worldHeight);
            safe = true;

            for (let id in avoid) {
                const w = avoid[id];
                if (
                    x < w.x + w.width &&
                    x + width > w.x &&
                    y < w.y + w.height &&
                    y + height > w.y
                ) {
                    safe = false;
                    break;
                }
            }
        } while (!safe);

        return { x, y };
    }

    generateAnimationDirectionFromAnalog(p, o) {
        if (o.dx !== 0 || o.dy !== 0) {
            if (Math.abs(o.dx) > Math.abs(o.dy)) {
                p.animationDirection = o.dx > 0 ? "right" : "left";
            } else {
                p.animationDirection = o.dy > 0 ? "bottom" : "top";
            }
        }
    }
    generateXDirectionFromAnalog(p, o) {
        if (o.dx !== 0 || o.dy !== 0)
            p.animationDirection = o.dx > 0 ? "right" : "left";
    }
}

//kita buat class ai yg bisa dipakai ulang
class AI_Behaviour{
  #entity
  #stateData = null
  
  constructor(entity){
    this.#entity = entity
  }
  
  update(dt, player){
    if(!this.#stateData){
      const action = this.decide(player)
      this.startAction(action)
    }
    
    this.#runState(dt)
  }
  
  decide(dt, player){
    return "idle"
  }
  
  getPatterns(){
    return {
      A : [["idle", 1]]
    }
  }
  
  startAction(action){
    const patterns = this.getPatterns()
    if(!patterns[action]){
    action = Object.keys(patterns)[0] 
  }
    this.#stateData = {
      step : 0,
      time : 0,
      states : patterns[action]
    }
    
    const firstState = patterns[action][0][0]
    this.#entity.state = firstState
    this.#entity.superState = true
  }
  
  #runState(dt){
    const s = this.#stateData
    if(!s) return
    
    const current = s.states[s.step]
    
    s.time += dt
    
    if(s.time >= current[1]){
      s.time = 0
      s.step ++
      
      if(s.step >= s.states.length){
        this.#stateData = null
        this.#entity.superState = false
        return
      }
    }
    
    this.#entity.state = s.states[s.step][0]
  }
  
  getEntity(){
    return this.#entity
  }
}
