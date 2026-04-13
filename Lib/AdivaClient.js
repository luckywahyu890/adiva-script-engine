// =======================
// RENDERER (HANDLE WEBGL)
// =======================
class Renderer {
    constructor(gl, canvas) {
        this.gl = gl;

        this.canvas = canvas;

        this.program = this.createProgram();

        this.a_position = gl.getAttribLocation(this.program, "a_position");
        this.a_texCoord = gl.getAttribLocation(this.program, "a_texCoord");

        this.u_resolution = gl.getUniformLocation(this.program, "u_resolution");
        this.u_color = gl.getUniformLocation(this.program, "u_color");

        this.u_translation = gl.getUniformLocation(
            this.program,
            "u_translation"
        );
        this.u_scale = gl.getUniformLocation(this.program, "u_scale");
        this.u_rotation = gl.getUniformLocation(this.program, "u_rotation");

        // 🔹 COLOR MAP (reusable)
        this.colors = {
            // basic
            white: [1, 1, 1],
            black: [0, 0, 0],
            red: [1, 0, 0],
            green: [0, 1, 0],
            blue: [0, 0, 1],

            // bright
            lime: [0, 1, 0],
            aqua: [0, 1, 1],
            cyan: [0, 1, 1],
            yellow: [1, 1, 0],
            magenta: [1, 0, 1],
            fuchsia: [1, 0, 1],

            // common UI
            orange: [1, 0.65, 0],
            gold: [1, 0.84, 0],
            tomato: [1, 0.39, 0.28],
            coral: [1, 0.5, 0.31],
            salmon: [0.98, 0.5, 0.45],

            // dark
            maroon: [0.5, 0, 0],
            navy: [0, 0, 0.5],
            olive: [0.5, 0.5, 0],
            teal: [0, 0.5, 0.5],
            purple: [0.5, 0, 0.5],

            // gray
            gray: [0.5, 0.5, 0.5],
            grey: [0.5, 0.5, 0.5],
            silver: [0.75, 0.75, 0.75],
            lightgray: [0.83, 0.83, 0.83],
            darkgray: [0.33, 0.33, 0.33],

            // extra UI
            pink: [1, 0.75, 0.8],
            hotpink: [1, 0.41, 0.71],
            violet: [0.93, 0.51, 0.93],
            indigo: [0.29, 0, 0.51],
            brown: [0.65, 0.16, 0.16],
            chocolate: [0.82, 0.41, 0.12],
            tan: [0.82, 0.71, 0.55],

            // game useful
            sky: [0.53, 0.81, 0.92],
            skyblue: [0.53, 0.81, 0.92],
            grass: [0.2, 0.8, 0.2],
            sand: [0.94, 0.87, 0.73],
            fire: [1, 0.27, 0],
            blood: [0.55, 0, 0]
        };

        // STATIC BUFFERS
        this.positionBuffer = gl.createBuffer();
        this.texcoordBuffer = gl.createBuffer();

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
            gl.STATIC_DRAW
        );

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
            gl.STATIC_DRAW
        );

        gl.useProgram(this.program);

        gl.enableVertexAttribArray(this.a_position);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.a_position, 2, gl.FLOAT, false, 0, 0);

        gl.enableVertexAttribArray(this.a_texCoord);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
        gl.vertexAttribPointer(this.a_texCoord, 2, gl.FLOAT, false, 0, 0);

        // WHITE TEXTURE
        this.whiteTex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.whiteTex);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            1,
            1,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([255, 255, 255, 255])
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // canvas untuk text
        this.textCanvas = document.createElement("canvas");
        this.textCtx = this.textCanvas.getContext("2d");
        this.textTexture = gl.createTexture();
    }

    createShader(type, source) {
        const s = this.gl.createShader(type);
        this.gl.shaderSource(s, source);
        this.gl.compileShader(s);
        return s;
    }

    createProgram() {
        const vertexSrc = `
attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_scale;
uniform float u_rotation;

varying vec2 v_texCoord;

void main() {

    vec2 center = u_scale * 0.5;
    vec2 pos = a_position * u_scale;

    vec2 rotated = vec2(
        cos(u_rotation) * (pos.x - center.x) - sin(u_rotation) * (pos.y - center.y) + center.x,
        sin(u_rotation) * (pos.x - center.x) + cos(u_rotation) * (pos.y - center.y) + center.y
    );

    vec2 finalPos = rotated + u_translation;

    vec2 zeroToOne = finalPos / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    v_texCoord = a_texCoord;
}`;

        const fragmentSrc = `
precision mediump float;

varying vec2 v_texCoord;

uniform sampler2D u_texture;
uniform vec4 u_color;

void main() {
    gl_FragColor = texture2D(u_texture, v_texCoord) * u_color;
}`;

        const vs = this.createShader(this.gl.VERTEX_SHADER, vertexSrc);
        const fs = this.createShader(this.gl.FRAGMENT_SHADER, fragmentSrc);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vs);
        this.gl.attachShader(program, fs);
        this.gl.linkProgram(program);

        return program;
    }

    draw(
        tex,
        x,
        y,
        w,
        h,
        flipX = false,
        rotation = 0,
        alpha = 1,
        color = "white"
    ) {
        const gl = this.gl;

        if (typeof color === "string") {
            color = this.colors[color] || [1, 1, 1];
        }

        let tx = x;
        let sx = w;

        if (flipX) {
            tx = x + w;
            sx = -w;
        }

        gl.uniform2f(this.u_translation, tx, y);
        gl.uniform2f(this.u_scale, sx, h);
        gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);
        gl.uniform1f(this.u_rotation, rotation);

        gl.uniform4f(this.u_color, color[0], color[1], color[2], alpha);

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    fillRect(x, y, w, h, color = "white", alpha = 1) {
        const gl = this.gl;

        const c = this.colors[color] || [1, 1, 1];

        gl.uniform2f(this.u_translation, x, y);
        gl.uniform2f(this.u_scale, w, h);
        gl.uniform2f(this.u_resolution, this.canvas.width, this.canvas.height);

        gl.uniform4f(this.u_color, c[0], c[1], c[2], alpha);

        gl.bindTexture(gl.TEXTURE_2D, this.whiteTex);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    test(t, x = canvas.width / 6, y = canvas.height / 4) {
        this.fillText(t, x, y, 24, "lime");
    }
    fillText(
        text,
        x,
        y,
        size = 24,
        color = "white",
        alpha = 1,
        font = "Arial"
    ) {
        const gl = this.gl;
        const ctx = this.textCtx;

        ctx.font = "bold " + size + "px " + font;

        const metrics = ctx.measureText(text);
        const w = Math.ceil(metrics.width);
        const h = Math.ceil(size * 1.4);

        this.textCanvas.width = w;
        this.textCanvas.height = h;

        ctx.clearRect(0, 0, w, h);
        ctx.font = "bold " + size + "px " + font;
        ctx.textBaseline = "top";
        ctx.fillStyle = color;
        ctx.fillText(text, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, this.textTexture);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            this.textCanvas
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        this.draw(this.textTexture, x, y, w, h, false, 0, alpha, "white");
    }
}

// =======================
// DRAW SYSTEM
// =======================
class Draw {
    constructor(targets, tex, renderer, gameState = null) {
        this.targets = targets;
        this.tex = tex;

        this.renderer = renderer;
        this.gameState = gameState;

        this.stateData = new Map();
    }

    isVisible(obj, camX, camY, viewW, viewH) {
        return !(
            obj.x + obj.width < camX ||
            obj.x > camX + viewW ||
            obj.y + obj.height < camY ||
            obj.y > camY + viewH
        );
    }

    update(dt, camera = null, cb = () => {}) {
        if (!camera) camera = { x: 0, y: 0 };

        const camX = camera.x;
        const camY = camera.y;

        const viewW = this.renderer.canvas.width;
        const viewH = this.renderer.canvas.height;

        // hapus stateData entity yang sudah tidak ada
        for (const key of this.stateData.keys()) {
            if (!this.targets[key]) this.stateData.delete(key);
        }

        for (const key in this.targets) {
            const obj = this.targets[key];

            if (!obj) continue;

            // skip scene yang tidak aktif
            if (this.gameState && !this.gameState.has(obj.scene)) continue;

            // skip object di luar layar
            if (!this.isVisible(obj, camX, camY, viewW, viewH)) continue;

            // buat data animasi jika belum ada
            if (!this.stateData.has(key)) {
                this.stateData.set(key, {
                    frame: 0,
                    timer: 0,
                    lastState: ""
                });
            }

            const data = this.stateData.get(key);

            //const currentAnim = this.animMap[obj.state] || obj.img;
            const currentAnim = obj.img;
            const frames = this.tex[currentAnim];

            if (!frames) continue;

            // reset animasi jika state berubah
            /* if (obj.state !== data.lastState) {
                data.frame = 0;
                data.timer = 0;
                data.lastState = obj.state;
            }*/
            if (obj.img !== data.lastState) {
                data.frame = 0;
                data.timer = 0;
                data.lastState = obj.img;
            }

            // arah animasi
            if (obj.vx > 0) obj.animationDirection = "right";
            else if (obj.vx < 0) obj.animationDirection = "left";

            // update animasi
            data.timer += dt * (obj.animSpeed || 10);

            if (data.timer >= 1) {
                data.timer = 0;
                data.frame++;

                if (data.frame >= frames.length) {
                    data.frame = 0;
                }
            }

            // ROTATION
            let rotation = 0;

            if (obj.isRotate) {
                obj.rotation = (obj.rotation || 0) + dt * 2;
                rotation = obj.rotation;
            }

            // ALPHA
            let alpha = 1;

            if (obj.isAlpha) {
                obj.alpha =
                    (obj.alpha !== undefined ? obj.alpha : 1) - dt * 0.5;

                if (obj.alpha < 0) obj.alpha = 0;

                alpha = obj.alpha;
            }

            // SCALE
            let scaleX = 1;
            let scaleY = 1;

            if (obj.isScale) {
                obj.scale = obj.scale || obj.scaleMin || 0.8;
                obj.scaleDir = obj.scaleDir || 1;

                obj.scale += obj.scaleDir * (obj.scaleSpeed || 1) * dt;

                if (obj.scale > (obj.scaleMax || 1.065)) {
                    obj.scale = obj.scaleMax || 1.065;
                    obj.scaleDir = -1;
                } else if (obj.scale < (obj.scaleMin || 1)) {
                    obj.scale = obj.scaleMin || 1;
                    obj.scaleDir = 1;
                }

                scaleX = obj.scale;
                scaleY = obj.scale;
            }

            // DRAW
            this.renderer.draw(
                frames[data.frame],
                obj.x - camX,
                obj.y - camY,
                obj.width * scaleX,
                obj.height * scaleY,
                obj.animationDirection === "left",
                rotation,
                alpha,
                obj.tintColor || [1, 1, 1]
            );

            cb(obj);
        }
    }
}

// =======================
// ASET
// =======================
class Aset {
    constructor(gl, listImg = {}, listAudio = {}) {
        this.gl = gl;
        this.listImg = listImg;
        this.listAudio = listAudio;

        this.textures = {};
        this.audios = {};
    }

    parsePath(path) {
        const match = path.match(/\*(\d+)/);
        if (!match) return [path];

        const total = parseInt(match[1]);
        const base = path.replace(/\*\d+/, "");

        const dotIndex = base.lastIndexOf(".");
        const name = base.slice(0, dotIndex);
        const ext = base.slice(dotIndex);

        const result = [];
        for (let i = 1; i <= total; i++) {
            result.push(`${name}${i}${ext}`);
        }

        return result;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => resolve(img);

            img.onerror = () => {
                console.warn(`[ASET ERROR] Gagal load gambar: ${src}`);
                reject(`Image not found: ${src}`);
            };

            img.src = src;
        });
    }

    createTexture(img) {
        const gl = this.gl;
        const tex = gl.createTexture();

        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );

        return tex;
    }

    async load() {
        const entries = Object.entries(this.listImg);

        for (const [key, val] of entries) {
            const paths = this.parsePath(val.path);

            try {
                const imgs = await Promise.all(
                    paths.map(p => this.loadImage(p))
                );
                this.textures[key] = imgs.map(img => this.createTexture(img));
            } catch (err) {
                console.warn(`[ASET WARNING] Asset "${key}" gagal dimuat`);
            }
        }

        // audio tidak async → tidak bisa bikin loading macet
        for (const [key, path] of Object.entries(this.listAudio)) {
            this.audios[key] = new Audio(path);
        }

        return this.textures;
    }

    play(name) {
        const audio = this.audios[name];

        if (!audio) {
            console.warn(`[ASET] Audio "${name}" tidak ada`);
            return;
        }

        audio.currentTime = 0;
        audio.play();
    }
}
// =======================
// GAME LOOP
// =======================
class GameLoop {
    constructor(canvas) {
        this.canvas = canvas;
        this.camera = { x: 0, y: 0 };
        this.gl = canvas.getContext("webgl");

        const gl = this.gl;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);

        this.lastTime = performance.now();

        // 🔥 HARUS object
        this.portraitSize = {};

        // 🔥 resize listener system
        this.resizeCallbacks = [];
        this.gameState = [];

        this.resizeCanvas = this.resizeCanvas.bind(this);

        this.resizeCanvas("mainAdv");
        window.addEventListener("resize", () => {
            this.resizeCanvas("mainAdv");
        });
    }
    /* ============================= */
    /* ADD RESIZE LISTENER */
    /* ============================= */
    addResizeListener(fn) {
        this.resizeCallbacks.push(fn);
    }

    resizeCanvas(key) {
        const isPortrait = window.innerHeight >= window.innerWidth;
        const mode = isPortrait ? "portrait" : "landscape";

        if (isPortrait) {
            if (!this.portraitSize[key]) {
                this.portraitSize[key] = {
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            }

            this.canvas.width = this.portraitSize[key].width;
            this.canvas.height = this.portraitSize[key].height;
        } else {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        // 🔥 penting untuk WebGL
        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.resizeCallbacks.forEach(fn => {
            fn({
                canvas: this.canvas,
                camera: this.camera,
                mode: mode
            });
        });
    }
    cameraOn(players, myID, X = 4, Y = 2, cb = () => {}) {
        if (!players || !myID || !players[myID]) return;

        const me = players[myID];
        cb(me);
        const targetX = me.x - this.canvas.width / X + me.width / 2;
        const targetY = me.y - this.canvas.height / Y + me.height / 2;

        const smooth = 0.05;

        this.camera.x += (targetX - this.camera.x) * smooth;
        this.camera.y += (targetY - this.camera.y) * smooth;
    }

    render(cb) {
        const loop = now => {
            let dt = (now - this.lastTime) / 1000;
            if (dt > 0.033) dt = 0.033;
            this.lastTime = now;

            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            cb(dt);

            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }
}

class VirtualButton {
    static injected = false;

    static injectCSS() {
        if (this.injected) return;

        const style = document.createElement("style");
        style.textContent = `
      .vbtn{
      display : block;
        position:fixed;
        bottom:25px;
        width:80px;
        height:80px;
        border-radius:50%;
        border:none;
        font-size:26px;
        font-weight:bold;
        background:rgba(255,255,255,0.25);
        backdrop-filter:blur(6px);
        color:white;
        user-select:none;
        touch-action:none;
        transition: transform 0.08s ease;
will-change: transform;
      }

      .vbtn:active{
        transform: scale(0.9);
      }
    `;
        document.head.appendChild(style);
        this.injected = true;
    }

    constructor({
        text = "",
        img = null,
        imgScale = 0.6,
        left = null,
        right = null,
        bottom = 15,
        top = null,
        size = 65,
        background = "rgba(128,128,128,0.5)",
        onPress = () => {},
        onRelease = () => {}
    }) {
        VirtualButton.injectCSS();

        this.el = document.createElement("button");
        this.el.className = "vbtn";
        this.el.textContent = text;

        this.el.style.width = size + "px";
        this.el.style.height = size + "px";
        this.el.style.bottom = bottom + "px";
        this.el.style.background = background;

        if (img) {
            this.el.style.backgroundImage = `url(${img})`;
            this.el.style.backgroundSize = imgScale * 100 + "%";
            this.el.style.backgroundRepeat = "no-repeat";
            this.el.style.backgroundPosition = "center";
        }

        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";

        document.body.appendChild(this.el);
        this.isHolding = false;

        this.el.addEventListener("pointerdown", e => {
            e.preventDefault();
            this.isHolding = true;
            onPress(this.el);
        });

        const release = e => {
            e.preventDefault();
            this.isHolding = false;
            onRelease();
        };

        this.el.addEventListener("pointerup", release);
        this.el.addEventListener("pointercancel", release);
        this.el.addEventListener("pointerleave", release);
    }
    static clickOnCanvas(canvas, client, cb) {
        canvas.addEventListener("pointerdown", e => {
            const rect = canvas.getBoundingClientRect();

            targetX = e.clientX - rect.left + client.app.camera.x;
            targetY = e.clientY - rect.top + client.app.camera.y;
            cb({ x: targetX, y: targetY });
        });
    }
}

//kalau lo jago, pakai export import, tambah saja disini hehe
