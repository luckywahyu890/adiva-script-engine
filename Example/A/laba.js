// kita buat BOS nya adalah guinevere
class Guinevere extends AI_Behaviour {
    decide(miya) {
        const guin = this.getEntity();
        const dx = miya.x - guin.x;
        const dis = Math.abs(dx);
        if (dis < 250) {
            return "faseA";
        }

        return "faseA";
    }
    getPatterns() {
        return {
            faseA: [
                ["kejar", 3],
                ["lompat1", 0.3],
                ["kejar", 1.5],
                ["nembak", 1.5],
                ["mundur", 1],
                ["kejar", 1.5],
                ["lompat2", 0.5],
                ["mundur", 0.3],
                ["kejar", 0.3],
                ["nembak2", 1],
                ["kejar", 0.5],
                ["mundur", 0.7],
                ["nembak3", 0.7]
            ],
            diam: [["diam", 1]]
        };
    }
}

Object.values(guin).forEach(el => {
    el.guin_AI = new Guinevere(el);
});

//kita buat supaya guin bisa nembak2

const peluruGuin = {};
for (let i = 0; i < 10; i++) {
    peluruGuin[i] = {
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        scene: "inactive",
        type: "peluruGuin",
        img: "bolaGuin",
        vy: 0,
        vx: 0
    };
}

const dialog2 = new VirtualLyrics(canvas)
    .startX(10)
    .startY(90)
    .color("white")
    .fill("Kalah kan monster")
    .fill("LABA - LABA")
    .fill("untuk membuka pintu di depan")
const dialog3 = new VirtualLyrics(canvas)
    .startX(10)
    .startY(90)
    .color("white")
    .fill("SIAKA...., SIAKA.....")
    .fill("boleh juga kemampuan mu")
    .fill("dalam memanah, asal engkau tau...")
    .fill("bukan hanya dirimu saja")
    .fill("yang memiliki kesadaran")
    .fill("dibalik permaianan ini")
    .fill("sampai ketemu lagi SIAKA....")


function logikaGuinevere(dt, hero, hpBar, physics, utils) {
    const miya = hero.miya;

    Object.values(guin).forEach(el => {
        const dx = miya.x - el.x;
        const dis = Math.abs(dx);
        /*const dxOri = el.originalX - el.x;
        const disOri = Math.abs(dxOri);
        if(disOri<500){
          el.x += dx * dt
          return
        }*/
        
        el.img = "guinDiam";
        if (dis < 500) {
            el.playDialog2 = true
        }
        if(el.playDialog2)dialog2.play(dt);
        if (dis < 300) el.aktif = true;
        if (!el.aktif) return;
        
        el.guin_AI.update(dt, miya);
        utils.timer(dt, "guinTime", 0.5, () => {
            el.tintColor = "white";
        });

        if (el.hp < 1) {
          Object.values(tembok).forEach(wl=>{
            if(wl.img === "gerbang")wl.scene = "inactive"
          })
          dialog3.play(dt)
            el.scene = "inactive";
        }
        if (el.scene === "inactive") return;
        //kita pakai fitur bawaan adiva engine. sudah ku upload di github kalau mau mempelajari.
        el.useCollider ??= true;
        el.colliderBox ??= { width: 50, height: 60 };
        el.gravity ??= 2000;
        el.vx ??= 0;
        el.vy ??= 0;

        physics.applyPhysics(dt, el);
        el.vy += el.gravity * dt;

        //kita atur ai nya disini
        //el.state ini berubah ubah karena class Guinevere extends AI_Brhaviour
        switch (el.state) {
            case "nembak":
                el.vx = 0;
                el.img = "guinShoot";
                utils.timer(dt, "timeShoot", 0.1, () => {
                    for (let pel of Object.values(peluruGuin)) {
                        if (pel.scene === "inactive") {
                            pel.scene = "1";
                            pel.lifeTime = 2;
                            pel.x = el.x + el.width / 2;
                            pel.y = el.y + el.height / 3;
                            pel.animationDirection = el.animationDirection;
                            pel.dir =
                                el.animationDirection === "right" ? 1 : -1;
                            break;
                        }
                    }
                });
                break;
            case "nembak2":
                el.vx = 0;
                el.img = "guinShoot";
                utils.timer(dt, "timeShoot", 0.1, () => {
                    el.vy = -350;
                    for (let pel of Object.values(peluruGuin)) {
                        if (pel.scene === "inactive") {
                            pel.scene = "1";
                            pel.lifeTime = 2;
                            pel.x = el.x + el.width / 2;
                            pel.y = el.y + el.height / 3;
                            pel.animationDirection = el.animationDirection;
                            pel.dir =
                                el.animationDirection === "right" ? 1 : -1;
                            break;
                        }
                    }
                });
                break;
            case "nembak3":
                el.vx = 0;
                el.img = "guinShoot";
                utils.timer(dt, "timeShoot", 0.1, () => {
                    for (let pel of Object.values(peluruGuin)) {
                        if (pel.scene === "inactive") {
                            pel.scene = "1";
                            pel.lifeTime = 2;
                            pel.x = el.x + el.width / 2;
                            pel.y = el.y + el.height / 3;
                            pel.vy = utils.rand(-300, 300);
                            pel.animationDirection = el.animationDirection;
                            pel.dir =
                                el.animationDirection === "right" ? 1 : -1;
                            break;
                        }
                    }
                });
                break;
            case "kejar":
                if (dis > 60) {
                    if (dx > 5) {
                        el.vx = 200;
                    } else if (dx < -5) {
                        el.vx = -200;
                    }
                }
                el.img = "guinLari";
                break;
            case "lompat1":
                if (dis > 60) {
                    if (dx > 5) {
                        el.vx = 90;
                    } else if (dx < -5) {
                        el.vx = -90;
                    }
                }
                el.img = "guinLompat";
                el.vy = -300;
                break;
            case "mundur":
                if (dis > 60) {
                    if (dx > 5) {
                        el.vx = -200;
                    } else if (dx < -5) {
                        el.vx = 200;
                    }
                }
                el.img = "guinLari";
                break;
            case "lompat2":
                el.vy = -350;
                el.img = "guinLompat";
                break;
            case "diam":
                el.vx = 0;
                el.img = "guinDiam";
                break;
        }
    });

    physics.aabb(hero, "guin", (g1, g2) => {
        g1.hp--;
        hpBar.setValue(g1.hp);
        g2.img = "guinUlti";
    });
}

function updatePeluruGuin(dt) {
    Object.values(peluruGuin).forEach(pel => {
        if (pel.scene === "inactive") return;
        pel.x += pel.dir * 300 * dt;
        pel.y += pel.vy * dt;

        pel.lifeTime -= dt;
        if (pel.lifeTime <= 0) pel.scene = "inactive";
    });
}

function hpGuin(dt, monster, camera, renderer) {
    if (monster.hp <= 0) return;
    monster.hpVisual ??= monster.hp;
    monster.hpVisual -= (monster.hpVisual - monster.hp) * 5 * dt;

    renderer.fillRect(
        monster.x - camera.x,
        monster.y - camera.y,
        monster.hpVisual,
        8,
        "maroon"
    );
    renderer.fillRect(
        monster.x - camera.x,
        monster.y - camera.y,
        monster.hp,
        8,
        "red"
    );
}

function panahMiyaVsGuin(dt, panah, physics) {
    physics.aabb(panah, "guin", (g1, g2) => {
        if (g2.img === "guinDiam") return;
        if (!g2.aktif) return;
        g2.hp -= 2;
        g2.tintColor = "red";
        delete panah[g1.id];
    });
}
function peluruGuinVsMiya(dt, hero, hpBar, physics) {
    physics.aabb(hero, "peluruGuin", (g1, g2) => {
        g1.hp -= 10;
        hpBar.setValue(g1.hp);
        g1.tintColor = "red";
        g2.scene = "inactive";
    });
}
