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

      .vbtn.vbtn--hidden {
        opacity: 0;
        pointer-events: none;
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
        visible = true,
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

        this._visible = visible;
        if (!visible) this.el.classList.add("vbtn--hidden");

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

    // ─── Visibility ───────────────────────────────────────────────────────────

    show() {
        if (this._visible) return this;
        this._visible = true;
        this.el.classList.remove("vbtn--hidden");
        return this;
    }

    hide() {
        if (!this._visible) return this;
        this._visible = false;
        this.el.classList.add("vbtn--hidden");
        return this;
    }

    toggle() {
        return this._visible ? this.hide() : this.show();
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    get visible() {
        return this._visible;
    }

    // ─── Static helpers ───────────────────────────────────────────────────────

    static clickOnCanvas(canvas, client, cb) {
        canvas.addEventListener("pointerdown", e => {
            const rect = canvas.getBoundingClientRect();

            targetX = e.clientX - rect.left + client.app.camera.x;
            targetY = e.clientY - rect.top + client.app.camera.y;
            cb({ x: targetX, y: targetY });
        });
    }
}


class VirtualText {
    static injected = false;

    static injectCSS() {
        if (this.injected) return;
        const style = document.createElement("style");
        style.textContent = `
            .vtext {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                user-select: none;
                white-space: pre;
                line-height: 1.2;
                will-change: transform, opacity;
                transition: opacity 0.2s ease;
            }
            .vtext.vtext--hidden {
                opacity: 0;
            }
            .vtext.vtext--animate {
                transition: opacity 0.2s ease, transform 0.15s ease;
            }
        `;
        document.head.appendChild(style);
        this.injected = true;
    }

    /**
     * @param {Object} opts
     * @param {string}   [opts.text=""]
     * @param {number}   [opts.left]
     * @param {number}   [opts.right]
     * @param {number}   [opts.top]
     * @param {number}   [opts.bottom]
     * @param {string}   [opts.color="white"]
     * @param {number}   [opts.fontSize=20]
     * @param {string}   [opts.fontFamily="monospace"]
     * @param {string}   [opts.fontWeight="bold"]
     * @param {number}   [opts.opacity=1]
     * @param {string}   [opts.textShadow="0 1px 4px rgba(0,0,0,0.6)"]
     * @param {string}   [opts.background="transparent"]
     * @param {string}   [opts.padding="0"]
     * @param {string}   [opts.borderRadius="0"]
     * @param {number}   [opts.maxWidth]          — wraps text if set (px)
     * @param {boolean}  [opts.visible=true]
     * @param {string}   [opts.id]                — optional DOM id
     * @param {Element}  [opts.parent=document.body]
     */
    constructor({
        text = "",
        left = null,
        right = null,
        top = null,
        bottom = null,
        color = "white",
        fontSize = 20,
        fontFamily = "monospace",
        fontWeight = "bold",
        opacity = 1,
        textShadow = "0 1px 4px rgba(0,0,0,0.6)",
        background = "transparent",
        padding = "0",
        borderRadius = "0",
        border = null,
        maxWidth = null,
        visible = true,
        id = null,
        parent = document.body
    } = {}) {
        VirtualText.injectCSS();

        this._text = text;
        this._visible = visible;
        this._rafId = null;
        this._dirty = false;
        this._pending = null; // batched next text

        this.el = document.createElement("div");
        this.el.className = "vtext";
        if (id) this.el.id = id;

        // — position
        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";

        // — typography
        this.el.style.color = color;
        this.el.style.fontSize = fontSize + "px";
        this.el.style.fontFamily = fontFamily;
        this.el.style.fontWeight = fontWeight;
        this.el.style.opacity = visible ? opacity : 0;
        this.el.style.textShadow = textShadow;
        this.el.style.background = background;
        this.el.style.padding = padding;
        this.el.style.borderRadius = borderRadius;
        if (border) this.el.style.border = border;

        if (maxWidth !== null) {
            this.el.style.maxWidth = maxWidth + "px";
            this.el.style.whiteSpace = "pre-wrap";
        }

        if (!visible) this.el.classList.add("vtext--hidden");

        this._baseOpacity = opacity;
        this.el.textContent = text;
        parent.appendChild(this.el);
    }

    // ─── Core update (rAF-batched, zero GC pressure) ──────────────────────────

    /** Update text content. Batches multiple calls in the same frame. */
    update(text) {
        this._pending = text;
        if (!this._dirty) {
            this._dirty = true;
            this._rafId = requestAnimationFrame(this._flush.bind(this));
        }
        return this;
    }

    _flush() {
        if (this._pending !== null && this._pending !== this._text) {
            this._text = this._pending;
            this.el.textContent = this._text;
        }
        this._pending = null;
        this._dirty = false;
        this._rafId = null;
    }

    /** Force-update without waiting for rAF (use sparingly). */
    updateNow(text) {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._dirty = false;
        this._pending = null;
        this._text = text;
        this.el.textContent = text;
        return this;
    }

    // ─── Visibility ───────────────────────────────────────────────────────────

    show(animate = false) {
        if (this._visible) return this;
        this._visible = true;
        this.el.classList.toggle("vtext--animate", animate);
        this.el.classList.remove("vtext--hidden");
        this.el.style.opacity = this._baseOpacity;
        return this;
    }

    hide(animate = false) {
        if (!this._visible) return this;
        this._visible = false;
        this.el.classList.toggle("vtext--animate", animate);
        this.el.classList.add("vtext--hidden");
        this.el.style.opacity = 0;
        return this;
    }

    toggle(animate = false) {
        return this._visible ? this.hide(animate) : this.show(animate);
    }

    // ─── Style helpers (chainable) ────────────────────────────────────────────

    setColor(color) {
        this.el.style.color = color;
        return this;
    }
    setFontSize(px) {
        this.el.style.fontSize = px + "px";
        return this;
    }
    setFontWeight(w) {
        this.el.style.fontWeight = w;
        return this;
    }
    setOpacity(v) {
        this._baseOpacity = v;
        if (this._visible) this.el.style.opacity = v;
        return this;
    }
    setBackground(bg) {
        this.el.style.background = bg;
        return this;
    }
    setShadow(shadow) {
        this.el.style.textShadow = shadow;
        return this;
    }

    // ─── Position helpers (chainable) ─────────────────────────────────────────

    moveTo({ left = null, right = null, top = null, bottom = null } = {}) {
        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";
        return this;
    }

    // ─── Flash / pulse effect ─────────────────────────────────────────────────

    /**
     * Briefly flash the text (useful for score bumps).
     * @param {string}  [color="#FFD700"]  flash color
     * @param {number}  [duration=400]     ms
     */
    flash(color = "#FFD700", duration = 400) {
        const prev = this.el.style.color;
        this.el.style.color = color;
        this.el.style.transform = "scale(1.25)";
        this.el.classList.add("vtext--animate");
        setTimeout(() => {
            this.el.style.color = prev;
            this.el.style.transform = "scale(1)";
        }, duration);
        return this;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    /** Remove element from DOM and cancel any pending frame. */
    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.el.remove();
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    get text() {
        return this._text;
    }
    get visible() {
        return this._visible;
    }
}

class VirtualImg {
    static injected = false;

    static injectCSS() {
        if (this.injected) return;
        const style = document.createElement("style");
        style.textContent = `
            .vimg {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                user-select: none;
                will-change: transform, opacity;
                display: block;
                overflow: hidden;
                transition: opacity 0.2s ease;
                flex-shrink: 0;
            }
            .vimg.vimg--hidden {
                opacity: 0 !important;
            }
            .vimg.vimg--animate {
                transition: opacity 0.2s ease, transform 0.15s ease;
            }
            .vimg img {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: cover;
                object-position: center center;
            }
        `;
        document.head.appendChild(style);
        this.injected = true;
    }

    /**
     * @param {Object}  opts
     *
     * — Source
     * @param {string}  [opts.src=""]
     * @param {string}  [opts.fallbackSrc]           Shown on load error
     * @param {string}  [opts.alt=""]
     *
     * — Size
     * @param {number}  [opts.width=100]             px
     * @param {number}  [opts.height=100]            px
     *
     * — Position (at least one of each axis)
     * @param {number}  [opts.left]
     * @param {number}  [opts.right]
     * @param {number}  [opts.top]
     * @param {number}  [opts.bottom]
     *
     * — Shape / clip
     * @param {string}  [opts.borderRadius="0"]
     *                  "50%"  → circle
     *                  "12px" → rounded corners
     *                  "0"    → square (default)
     * @param {string}  [opts.clipShape]
     *                  Extra CSS clip-path, e.g.:
     *                  "polygon(50% 0%,100% 50%,50% 100%,0% 50%)"  → diamond
     *                  "polygon(50% 0%,100% 100%,0% 100%)"          → triangle
     *
     * — Visual
     * @param {string}  [opts.background="transparent"]
     * @param {string}  [opts.border]                e.g. "3px solid white"
     * @param {string}  [opts.boxShadow]             e.g. "0 4px 20px rgba(0,0,0,.5)"
     * @param {string}  [opts.filter]                CSS filter, e.g. "brightness(1.2) blur(2px)"
     * @param {number}  [opts.opacity=1]
     * @param {boolean} [opts.visible=true]
     *
     * — Transform
     * @param {number}  [opts.scale=1]
     * @param {number}  [opts.rotate=0]              degrees
     * @param {boolean} [opts.flipX=false]
     * @param {boolean} [opts.flipY=false]
     *
     * — Misc
     * @param {string}  [opts.objectFit="cover"]     cover | contain | fill | scale-down
     * @param {string}  [opts.objectPosition="center center"]
     * @param {string}  [opts.id]
     * @param {boolean} [opts.interactive=false]     Allow pointer/mouse events
     * @param {Element} [opts.parent=document.body]
     */
    constructor({
        // Source
        src = "",
        fallbackSrc = null,
        alt = "",

        // Size
        width = 100,
        height = 100,

        // Position
        left = null,
        right = null,
        top = null,
        bottom = null,

        // Shape
        borderRadius = "0",
        clipShape = null,

        // Visual
        background = "transparent",
        border = null,
        boxShadow = null,
        filter = null,
        opacity = 1,
        visible = true,

        // Transform
        scale = 1,
        rotate = 0,
        flipX = false,
        flipY = false,

        // Misc
        objectFit = "cover",
        objectPosition = "center center",
        id = null,
        interactive = false,
        parent = document.body
    } = {}) {
        VirtualImg.injectCSS();

        this._src = src;
        this._fallback = fallbackSrc;
        this._visible = visible;
        this._baseOpacity = opacity;
        this._scale = scale;
        this._rotate = rotate;
        this._flipX = flipX;
        this._flipY = flipY;

        // rAF batch state
        this._dirty = false;
        this._rafId = null;
        this._pendingSrc = null;

        // ── Wrapper ──────────────────────────────────────────────────────────
        this.el = document.createElement("div");
        this.el.className = "vimg";
        if (id) this.el.id = id;

        // Size
        this.el.style.width = width + "px";
        this.el.style.height = height + "px";

        // Position
        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";

        // Shape
        this.el.style.borderRadius = borderRadius;
        if (clipShape) this.el.style.clipPath = clipShape;

        // Visual
        this.el.style.background = background;
        this.el.style.opacity = visible ? opacity : 0;
        if (border) this.el.style.border = border;
        if (boxShadow) this.el.style.boxShadow = boxShadow;
        if (filter) this.el.style.filter = filter;

        // Pointer
        this.el.style.pointerEvents = interactive ? "auto" : "none";

        if (!visible) this.el.classList.add("vimg--hidden");

        // Transform
        this._applyTransform();

        // ── Image element ─────────────────────────────────────────────────────
        this.img = document.createElement("img");
        this.img.alt = alt;
        this.img.style.objectFit = objectFit;
        this.img.style.objectPosition = objectPosition;

        // Load promise — await img.loaded
        this.loaded = new Promise((resolve, reject) => {
            this._resolveLoad = resolve;
            this._rejectLoad = reject;
        });

        this.img.onload = () => {
            this._resolveLoad(this.img);
        };
        this.img.onerror = () => {
            if (this._fallback && this.img.src !== this._fallback) {
                this.img.src = this._fallback;
            } else {
                this._rejectLoad(
                    new Error(`VirtualImg: failed to load "${this._src}"`)
                );
            }
        };

        if (src) this.img.src = src;

        this.el.appendChild(this.img);
        parent.appendChild(this.el);
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    _applyTransform() {
        const sx = this._flipX ? -this._scale : this._scale;
        const sy = this._flipY ? -this._scale : this._scale;
        this.el.style.transform = `scale(${sx}, ${sy}) rotate(${this._rotate}deg)`;
    }

    // ─── Source update (rAF-batched) ──────────────────────────────────────────

    /** Swap src — batches multiple calls in the same frame. */
    update(src) {
        this._pendingSrc = src;
        if (!this._dirty) {
            this._dirty = true;
            this._rafId = requestAnimationFrame(this._flush.bind(this));
        }
        return this;
    }

    _flush() {
        if (this._pendingSrc !== null && this._pendingSrc !== this._src) {
            this._src = this._pendingSrc;
            this.img.src = this._src;
        }
        this._pendingSrc = null;
        this._dirty = false;
        this._rafId = null;
    }

    /** Force src swap without waiting for rAF. */
    updateNow(src) {
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        this._dirty = false;
        this._pendingSrc = null;
        this._src = src;
        this.img.src = src;
        return this;
    }

    /** Fade out → swap src → fade in. */
    crossfade(src, ms = 300) {
        const prev = this.el.style.transition;
        this.el.style.transition = `opacity ${ms}ms ease`;
        this.el.style.opacity = 0;
        setTimeout(() => {
            this.img.src = src;
            this._src = src;
            this.el.style.opacity = this._visible ? this._baseOpacity : 0;
            setTimeout(() => {
                this.el.style.transition = prev;
            }, ms);
        }, ms);
        return this;
    }

    // ─── Visibility ───────────────────────────────────────────────────────────

    show(animate = false) {
        if (this._visible) return this;
        this._visible = true;
        this.el.classList.toggle("vimg--animate", animate);
        this.el.classList.remove("vimg--hidden");
        this.el.style.opacity = this._baseOpacity;
        return this;
    }

    hide(animate = false) {
        if (!this._visible) return this;
        this._visible = false;
        this.el.classList.toggle("vimg--animate", animate);
        this.el.classList.add("vimg--hidden");
        this.el.style.opacity = 0;
        return this;
    }

    toggle(animate = false) {
        return this._visible ? this.hide(animate) : this.show(animate);
    }

    // ─── Style helpers (chainable) ────────────────────────────────────────────

    setOpacity(v) {
        this._baseOpacity = v;
        if (this._visible) this.el.style.opacity = v;
        return this;
    }
    setBorderRadius(v) {
        this.el.style.borderRadius = typeof v === "number" ? v + "px" : v;
        return this;
    }
    setBorder(v) {
        this.el.style.border = v;
        return this;
    }
    setBoxShadow(v) {
        this.el.style.boxShadow = v;
        return this;
    }
    setBackground(v) {
        this.el.style.background = v;
        return this;
    }
    setFilter(v) {
        this.el.style.filter = v || "none";
        return this;
    }
    setClip(v) {
        this.el.style.clipPath = v || "none";
        return this;
    }
    setZIndex(v) {
        this.el.style.zIndex = v;
        return this;
    }
    setInteractive(v = true) {
        this.el.style.pointerEvents = v ? "auto" : "none";
        return this;
    }
    setObjectFit(v) {
        this.img.style.objectFit = v;
        return this;
    }
    setObjectPosition(v) {
        this.img.style.objectPosition = v;
        return this;
    }

    // ─── Position & size (chainable) ──────────────────────────────────────────

    moveTo({ left = null, right = null, top = null, bottom = null } = {}) {
        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";
        return this;
    }

    resize(width, height) {
        if (width != null) this.el.style.width = width + "px";
        if (height != null) this.el.style.height = height + "px";
        return this;
    }

    // ─── Transform (chainable) ────────────────────────────────────────────────

    setScale(v) {
        this._scale = v;
        this._applyTransform();
        return this;
    }
    setRotate(deg) {
        this._rotate = deg;
        this._applyTransform();
        return this;
    }
    flipX(s = true) {
        this._flipX = s;
        this._applyTransform();
        return this;
    }
    flipY(s = true) {
        this._flipY = s;
        this._applyTransform();
        return this;
    }
    resetTransform() {
        this._scale = 1;
        this._rotate = 0;
        this._flipX = false;
        this._flipY = false;
        this._applyTransform();
        return this;
    }

    // ─── Effects ──────────────────────────────────────────────────────────────

    flash(tint = "rgba(255,215,0,0.45)", duration = 400) {
        this.el.classList.add("vimg--animate");
        const prevBg = this.el.style.background;
        this._scale += 0.2;
        this._applyTransform();
        this.el.style.background = tint;
        setTimeout(() => {
            this._scale -= 0.2;
            this._applyTransform();
            this.el.style.background = prevBg;
        }, duration);
        return this;
    }

    pulse(times = 3, interval = 300) {
        let count = 0;
        const tick = () => {
            if (count >= times * 2) {
                this.el.style.opacity = this._baseOpacity;
                return;
            }
            this.el.style.opacity = count % 2 === 0 ? 0.15 : this._baseOpacity;
            count++;
            setTimeout(tick, interval);
        };
        tick();
        return this;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    destroy() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this.img.onload = null;
        this.img.onerror = null;
        this.el.remove();
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    get src() {
        return this._src;
    }
    get visible() {
        return this._visible;
    }
    get scale() {
        return this._scale;
    }
    get rotate() {
        return this._rotate;
    }
}

class VirtualLyrics {
    constructor(canvas) {
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new TypeError(
                "VirtualLyrics: first argument must be an HTMLCanvasElement"
            );
        }

        this._canvas = canvas;
        this._ctx = null;

        /* builder state */
        this._startX = 20;
        this._startY = 40;
        this._marginY = 36;
        this._color = "#ffffff";
        this._delay = 0.045;
        this._deadTime = 1.0;

        /* font / style */
        this._font = "16px monospace";
        this._shadowColor = "rgba(0,0,0,0.6)";
        this._shadowBlur = 4;

        /* text lines */
        this._lines = [];

        /* runtime state */
        this._lineIndex = 0;
        this._charIndex = 0;
        this._elapsed = 0;
        this._deadElap = 0;
        this._done = false;
        this._keepOnFlag = false;

        /* one-shot flag — aktif saat pertama dibuat, mati sendiri setelah selesai */
        this._active = true;

        /* cursor blink */
        this._cursorTimer = 0;
        this._cursorVisible = true;
    }

    /* ─────────────────────────── builder API ─────────────────────────── */

    startX(v) {
        this._startX = v;
        return this;
    }
    startY(v) {
        this._startY = v;
        return this;
    }
    marginY(v) {
        this._marginY = v;
        return this;
    }
    color(v) {
        this._color = v;
        return this;
    }
    delay(v) {
        this._delay = Math.max(0.001, v);
        return this;
    }
    deadTimer(v) {
        this._deadTime = Math.max(0, v);
        return this;
    }
    fill(text) {
        this._lines.push(String(text));
        return this;
    }
    font(v) {
        this._font = v;
        return this;
    }

    /* ─────────────────────────── public API ─────────────────────────── */

    /**
     * Panggil setiap frame.
     * Setelah semua baris selesai + deadTimer habis → berhenti otomatis (one-shot).
     * Tidak akan jalan lagi sampai playAgain() atau reactivate() dipanggil.
     *
     * @param {number} dt – delta time in seconds
     */
    play(dt) {
        if (!this._active) return; // one-shot guard
        if (this._lines.length === 0) return;

        this._ensureCtx();
        this._update(dt);
        this._draw();

        if (this._done && this._deadElap >= this._deadTime) {
            Promise.resolve().then(() => {
                if (this._keepOnFlag) {
                    this._keepOnFlag = false;
                    // keepOn: tampilan tetap, tapi _active mati
                    this._active = false;
                } else {
                    this._clearOverlay();
                    this._active = false;
                }
            });
        } else {
            this._keepOnFlag = false;
        }
    }

    /**
     * Tahan tampilan agar tidak di-clear setelah selesai.
     * Harus dipanggil di frame yang sama dengan play(). keepOn selalu menang.
     */
    keepOn() {
        this._keepOnFlag = true;
    }

    /** Reset manual + nonaktifkan. */
    reset() {
        this._reset();
        this._active = false;
    }

    /** true saat semua baris sudah selesai diketik. */
    get isFinished() {
        return this._done;
    }

    /** true selama animasi masih berjalan. */
    get isPlaying() {
        return this._active && !this._done;
    }

    /** true kalau dialog sedang idle (selesai / belum diaktifkan). */
    get isIdle() {
        return !this._active;
    }

    /* ─────────────────────────── private internals ─────────────────────── */

    _ensureCtx() {
        if (this._ctx) return;

        const webgl = this._canvas;
        const parent = webgl.parentElement;

        const overlay = document.createElement("canvas");
        overlay.width = webgl.width;
        overlay.height = webgl.height;
        overlay.className = "virtual-lyric-overlay";
        overlay.id = `vl-overlay-${Math.random().toString(36).slice(2, 9)}`;

        overlay.style.cssText = [
            "position:absolute",
            `left:${webgl.offsetLeft}px`,
            `top:${webgl.offsetTop}px`,
            `width:${webgl.style.width || webgl.width + "px"}`,
            `height:${webgl.style.height || webgl.height + "px"}`,
            "pointer-events:none",
            "z-index:10",
            "background:transparent" // eksplisit transparan, kebal * { background }
        ].join(";");

        if (parent) {
            const ps = getComputedStyle(parent).position;
            if (ps === "static") parent.style.position = "relative";
            parent.appendChild(overlay);
        } else {
            webgl.insertAdjacentElement("afterend", overlay);
        }

        if (typeof ResizeObserver !== "undefined") {
            new ResizeObserver(() => {
                overlay.width = webgl.width;
                overlay.height = webgl.height;
                overlay.style.left = webgl.offsetLeft + "px";
                overlay.style.top = webgl.offsetTop + "px";
                overlay.style.width = webgl.style.width || webgl.width + "px";
                overlay.style.height =
                    webgl.style.height || webgl.height + "px";
            }).observe(webgl);
        }

        this._ctx = overlay.getContext("2d");
        this._overlayCanvas = overlay;
    }

    _update(dt) {
        if (this._done) {
            this._deadElap += dt;
            return;
        }

        /* cursor blink */
        this._cursorTimer += dt;
        if (this._cursorTimer >= 0.5) {
            this._cursorTimer = 0;
            this._cursorVisible = !this._cursorVisible;
        }

        this._elapsed += dt;

        const charsThisFrame = Math.floor(this._elapsed / this._delay);
        if (charsThisFrame === 0) return;

        this._elapsed -= charsThisFrame * this._delay;

        const currentLine = this._lines[this._lineIndex];
        this._charIndex = Math.min(
            this._charIndex + charsThisFrame,
            currentLine.length
        );

        if (this._charIndex >= currentLine.length) {
            if (this._lineIndex < this._lines.length - 1) {
                this._lineIndex++;
                this._charIndex = 0;
                this._elapsed = 0;
            } else {
                this._done = true;
            }
        }
    }

    _draw() {
        const ctx = this._ctx;
        const w = this._overlayCanvas.width;
        const h = this._overlayCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.font = this._font;
        ctx.fillStyle = this._color;
        ctx.shadowColor = this._shadowColor;
        ctx.shadowBlur = this._shadowBlur;
        ctx.textBaseline = "top";

        for (let i = 0; i <= this._lineIndex; i++) {
            const x = this._startX;
            const y = this._startY + i * this._marginY;
            const text =
                i < this._lineIndex
                    ? this._lines[i]
                    : this._lines[i].slice(0, this._charIndex);

            ctx.fillText(text, x, y);

            if (i === this._lineIndex && !this._done && this._cursorVisible) {
                const tw = ctx.measureText(text).width;
                ctx.fillText("▌", x + tw + 1, y);
            }
        }

        ctx.restore();
    }

    _clearOverlay() {
        if (this._ctx) {
            this._ctx.clearRect(
                0,
                0,
                this._overlayCanvas.width,
                this._overlayCanvas.height
            );
        }
    }

    _reset() {
        this._lineIndex = 0;
        this._charIndex = 0;
        this._elapsed = 0;
        this._deadElap = 0;
        this._done = false;
        this._keepOnFlag = false;
        this._cursorTimer = 0;
        this._cursorVisible = true;
        this._clearOverlay();
    }
}

class VirtualBarDiv {
    static injected = false;

    static injectCSS() {
        if (this.injected) return;
        const style = document.createElement("style");
        style.textContent = `
            .vbar {
                position: fixed;
                z-index: 9999;
                pointer-events: none;
                user-select: none;
                overflow: hidden;
                will-change: transform, opacity;
                transition: opacity 0.2s ease;
            }
            .vbar.vbar--hidden {
                opacity: 0;
            }
            .vbar.vbar--animate {
                transition: opacity 0.2s ease, transform 0.15s ease;
            }
            .vbar__bg {
                position: absolute;
                inset: 0;
            }
            .vbar__visual {
                position: absolute;
                top: 0; left: 0;
                height: 100%;
                will-change: width;
            }
            .vbar__fill {
                position: absolute;
                top: 0; left: 0;
                height: 100%;
                will-change: width;
            }
        `;
        document.head.appendChild(style);
        this.injected = true;
    }

    /**
     * @param {Object} opts
     * @param {number}   [opts.value=100]          — current HP
     * @param {number}   [opts.maxValue=100]        — max HP
     * @param {number}   [opts.width=100]           — bar width (px)
     * @param {number}   [opts.height=8]            — bar height (px)
     * @param {number}   [opts.left]
     * @param {number}   [opts.right]
     * @param {number}   [opts.top]
     * @param {number}   [opts.bottom]
     * @param {string}   [opts.fillColor="red"]     — current HP color
     * @param {string}   [opts.visualColor="maroon"]— lerp/lag color
     * @param {string}   [opts.background="#333"]   — empty bar color
     * @param {number}   [opts.opacity=1]
     * @param {string}   [opts.borderRadius="0"]
     * @param {string}   [opts.border=null]
     * @param {number}   [opts.lerpSpeed=5]         — lerp speed (units/sec)
     * @param {boolean}  [opts.visible=true]
     * @param {string}   [opts.id]
     * @param {Element}  [opts.parent=document.body]
     */
    constructor({
        value = 100,
        maxValue = 100,
        width = 100,
        height = 8,
        left = null,
        right = null,
        top = null,
        bottom = null,
        fillColor = "red",
        visualColor = "maroon",
        background = "#333",
        opacity = 1,
        borderRadius = "0",
        border = null,
        lerpSpeed = 5,
        visible = true,
        id = null,
        parent = document.body
    } = {}) {
        VirtualBarDiv.injectCSS();

        this._value = value;
        this._maxValue = maxValue;
        this._visualValue = value; // lerped value
        this._width = width;
        this._lerpSpeed = lerpSpeed;
        this._visible = visible;
        this._baseOpacity = opacity;

        this._rafId = null;
        this._lastTime = null;
        this._animating = false;

        // — Root element
        this.el = document.createElement("div");
        this.el.className = "vbar";
        if (id) this.el.id = id;

        this.el.style.width = width + "px";
        this.el.style.height = height + "px";

        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";

        this.el.style.opacity = visible ? opacity : 0;
        this.el.style.borderRadius = borderRadius;
        if (border) this.el.style.border = border;
        if (!visible) this.el.classList.add("vbar--hidden");

        // — Background layer
        this._bgEl = document.createElement("div");
        this._bgEl.className = "vbar__bg";
        this._bgEl.style.background = background;
        this.el.appendChild(this._bgEl);

        // — Visual (lag) layer — behind fill, color like "maroon"
        this._visualEl = document.createElement("div");
        this._visualEl.className = "vbar__visual";
        this._visualEl.style.background = visualColor;
        this._visualEl.style.width = "100%";
        this.el.appendChild(this._visualEl);

        // — Fill (actual HP) layer — on top
        this._fillEl = document.createElement("div");
        this._fillEl.className = "vbar__fill";
        this._fillEl.style.background = fillColor;
        this._fillEl.style.width = "100%";
        this.el.appendChild(this._fillEl);

        parent.appendChild(this.el);

        this._render();
    }

    // ─── Core ─────────────────────────────────────────────────────────────────

    /** Set current value (e.g. current HP). Starts lerp animation automatically. */
    setValue(v) {
        this._value = Math.max(0, Math.min(this._maxValue, v));
        this._startLerp();
        return this;
    }

    /** Set max value. */
    setMaxValue(max) {
        this._maxValue = max;
        this._render();
        return this;
    }

    /** Instantly snap both fill and visual to value (no lerp). */
    setValueNow(v) {
        this._value = Math.max(0, Math.min(this._maxValue, v));
        this._visualValue = this._value;
        this._stopLerp();
        this._render();
        return this;
    }

    // ─── Lerp loop ────────────────────────────────────────────────────────────

    _startLerp() {
        if (this._animating) return;
        this._animating = true;
        this._lastTime = performance.now();
        this._rafId = requestAnimationFrame(this._lerpTick.bind(this));
    }

    _stopLerp() {
        if (this._rafId) cancelAnimationFrame(this._rafId);
        this._rafId = null;
        this._animating = false;
        this._lastTime = null;
    }

    _lerpTick(now) {
        const dt = Math.min((now - this._lastTime) / 1000, 0.1); // cap dt
        this._lastTime = now;

        // monster.hpVisual -= (monster.hpVisual - monster.hp) * 5 * dt
        this._visualValue -=
            (this._visualValue - this._value) * this._lerpSpeed * dt;

        this._render();

        const diff = Math.abs(this._visualValue - this._value);
        if (diff < 0.05) {
            this._visualValue = this._value;
            this._render();
            this._stopLerp();
        } else {
            this._rafId = requestAnimationFrame(this._lerpTick.bind(this));
        }
    }

    _render() {
        const visualPct = (this._visualValue / this._maxValue) * 100;
        const fillPct = (this._value / this._maxValue) * 100;
        this._visualEl.style.width = visualPct + "%";
        this._fillEl.style.width = fillPct + "%";
    }

    // ─── Position ─────────────────────────────────────────────────────────────

    moveTo({ left = null, right = null, top = null, bottom = null } = {}) {
        if (left !== null) this.el.style.left = left + "px";
        if (right !== null) this.el.style.right = right + "px";
        if (top !== null) this.el.style.top = top + "px";
        if (bottom !== null) this.el.style.bottom = bottom + "px";
        return this;
    }

    // ─── Visibility ───────────────────────────────────────────────────────────

    show(animate = false) {
        if (this._visible) return this;
        this._visible = true;
        this.el.classList.toggle("vbar--animate", animate);
        this.el.classList.remove("vbar--hidden");
        this.el.style.opacity = this._baseOpacity;
        return this;
    }

    hide(animate = false) {
        if (!this._visible) return this;
        this._visible = false;
        this.el.classList.toggle("vbar--animate", animate);
        this.el.classList.add("vbar--hidden");
        this.el.style.opacity = 0;
        return this;
    }

    toggle(animate = false) {
        return this._visible ? this.hide(animate) : this.show(animate);
    }

    // ─── Style helpers (chainable) ────────────────────────────────────────────

    setFillColor(color) {
        this._fillEl.style.background = color;
        return this;
    }
    setVisualColor(color) {
        this._visualEl.style.background = color;
        return this;
    }
    setBackground(color) {
        this._bgEl.style.background = color;
        return this;
    }
    setOpacity(v) {
        this._baseOpacity = v;
        if (this._visible) this.el.style.opacity = v;
        return this;
    }
    setLerpSpeed(s) {
        this._lerpSpeed = s;
        return this;
    }

    flash(color = "#FFD700", duration = 400) {
        const prev = this._fillEl.style.background;
        this._fillEl.style.background = color;
        this.el.style.transform = "scaleY(1.5)";
        this.el.classList.add("vbar--animate");
        setTimeout(() => {
            this._fillEl.style.background = prev;
            this.el.style.transform = "scaleY(1)";
        }, duration);
        return this;
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    get value() {
        return this._value;
    }
    get visualValue() {
        return this._visualValue;
    }
    get visible() {
        return this._visible;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    destroy() {
        this._stopLerp();
        this.el.remove();
    }
}

/*
Cara pakai:
const hpBar = new VirtualBarDiv({
    value: 100,
    maxValue: 100,
    width: 120,
    height: 8,
    top: 50,
    left: 200,
    fillColor: "red",
    visualColor: "maroon",
    background: "#222",
    lerpSpeed: 5,       // sama persis dengan * 5 * dt
});

// Waktu monster kena damage:
hpBar.setValue(monster.hp);

// Update posisi tiap frame (ikut kamera):
hpBar.moveTo({
    left: monster.x - camera.x,
    top:  monster.y - camera.y,
});
Bedanya dari renderer approach:
Lerp hpVisual diurus internal di dalam class lewat rAF loop, kamu cukup panggil setValue() saat HP berubah — tidak perlu update manual tiap frame
moveTo() tetap perlu dipanggil tiap frame kalau bar ikut posisi monster di world space*/
