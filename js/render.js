/** Chunky side-view field. Drawn at 400×225 and scaled up crisp. */

const W = 400;
const H = 340;
const VIEW = 50;

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

export class FieldView {
  constructor(canvas) {
    this.canvas = canvas;
    this.buf = document.createElement("canvas");
    this.buf.width = W;
    this.buf.height = H;
    this.ctx = this.buf.getContext("2d");
    this.t = 0;
    this.crowd = [];
    for (let i = 0; i < 220; i++) {
      this.crowd.push({
        x: Math.random() * W,
        y: 3 + Math.random() * 24,
        c: ["#15284d", "#3d2a1a", "#1c4d38", "#4a2030", "#223056"][i % 5],
        s: 1 + (i % 3),
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(160, Math.floor(rect.width * dpr));
    const h = Math.max(120, Math.floor(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
  }

  draw(snap) {
    this.t += 0.016;
    const ctx = this.ctx;
    const flip = !!snap.flip;
    const fx = (x) => (flip ? 100 - x : x);
    const ballX = snap.ball ? fx(snap.ball.x) : fx(snap.los || 25);
    let cam = ballX - 18;
    cam = clamp(cam, -12, 112 - VIEW);
    const project = (x, y) => {
      const sx = ((fx(x) - cam) / VIEW) * W;
      const sy = 40 + (y / 30) * (H - 52);
      return [sx, sy];
    };

    ctx.save();
    if (snap.shake > 0.4) {
      ctx.translate((Math.random() - 0.5) * snap.shake * 1.4, (Math.random() - 0.5) * snap.shake);
    }

    ctx.fillStyle = "#071226";
    ctx.fillRect(0, 0, W, H);
    for (const c of this.crowd) {
      const wave = Math.sin(this.t * 3 + c.x * 0.08) > 0.2 ? -1 : 0;
      ctx.fillStyle = c.c;
      ctx.fillRect(c.x, c.y + wave, c.s, c.s + 1);
    }
    ctx.fillStyle = "#c9d6ee";
    ctx.fillRect(8, 2, 10, 6);
    ctx.fillRect(W - 22, 2, 10, 6);
    ctx.fillStyle = "#ffe14a";
    ctx.globalAlpha = 0.35 + Math.sin(this.t * 8) * 0.1;
    ctx.fillRect(6, 8, 14, 3);
    ctx.fillRect(W - 24, 8, 14, 3);
    ctx.globalAlpha = 1;

    const grassTop = 36;
    const grassH = H - 42;
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#1a7a34" : "#14662c";
      ctx.fillRect((i * W) / 16, grassTop, W / 16 + 1, grassH);
    }

    const zone = (x0, x1, color) => {
      const a = project(x0, 15)[0];
      const b = project(x1, 15)[0];
      const left = Math.min(a, b);
      const width = Math.abs(b - a);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(left, grassTop, width, grassH);
      ctx.globalAlpha = 1;
    };
    zone(-12, 0, snap.player.color);
    zone(100, 112, snap.cpu.color);

    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 1;
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    for (let y = 0; y <= 100; y += 10) {
      const [sx] = project(y, 0);
      ctx.beginPath();
      ctx.moveTo(sx, grassTop);
      ctx.lineTo(sx, grassTop + grassH);
      ctx.stroke();
      const label = y === 50 ? "50" : String(Math.min(y, 100 - y));
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillText(label, sx, grassTop + 14);
      for (let hy = 0; hy < 5; hy++) {
        ctx.fillStyle = "rgba(255,255,255,.45)";
        ctx.fillRect(sx - 1, grassTop + 28 + hy * 28, 2, 6);
      }
    }
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    const [g0] = project(0, 0);
    const [g1] = project(100, 0);
    ctx.moveTo(Math.min(g0, g1), grassTop);
    ctx.lineTo(Math.max(g0, g1), grassTop);
    ctx.stroke();

    if (snap.phase === "live" || snap.phase === "playcall" || snap.phase === "fg") {
      const [lx] = project(snap.los, 0);
      ctx.strokeStyle = "#7ec8ff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, grassTop);
      ctx.lineTo(lx, grassTop + grassH);
      ctx.stroke();
      const [cx] = project(snap.chains, 0);
      ctx.strokeStyle = "#ffe14a";
      ctx.beginPath();
      ctx.moveTo(cx, grassTop);
      ctx.lineTo(cx, grassTop + grassH);
      ctx.stroke();
    }

    let guys = [...(snap.players || [])];
    if (snap.phase === "playcall" && guys.length === 0) {
      const dir = snap.offense === "cpu" ? -1 : 1;
      const offColor = snap.offense === "player" ? snap.player.color : snap.cpu.color;
      const defColor = snap.offense === "player" ? snap.cpu.color : snap.player.color;
      const ys = [6, 11, 14, 16, 19, 25];
      guys = ys.map((y, i) => ({
        x: snap.los + dir * (i === 2 ? -5 : -1),
        y,
        role: i === 2 ? "QB" : "OL",
        num: i === 2 ? (snap.offense === "player" ? 7 : 11) : 0,
        facing: dir,
        hasBall: i === 2,
        controlled: false,
        target: false,
        dive: false,
        juke: false,
        primary: offColor,
        secondary: "#f4f4f4",
        pants: "#24180f",
      })).concat(ys.map((y) => ({
        x: snap.los + dir * 1.6,
        y,
        role: "DL",
        num: 0,
        facing: -dir,
        hasBall: false,
        controlled: false,
        target: false,
        dive: false,
        juke: false,
        primary: defColor,
        secondary: "#111",
        pants: "#24180f",
      })));
    }
    guys.sort((a, b) => a.y - b.y);
    for (const p of guys) this.player(ctx, project, p);
    if (snap.ball && snap.ball.mode !== "dead") this.ball(ctx, project, snap.ball);

    ctx.restore();

    const out = this.canvas.getContext("2d");
    this.resize();
    out.imageSmoothingEnabled = false;
    out.fillStyle = "#061018";
    out.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const scale = this.canvas.width / W;
    const dw = this.canvas.width;
    const dh = Math.min(this.canvas.height, Math.floor(H * scale));
    out.drawImage(this.buf, 0, 0, dw, dh);
  }

  player(ctx, project, p) {
    const [sx, sy] = project(p.x, p.y);
    const bob = Math.sin(this.t * 14 + p.y) * (p.dive ? 0 : 1.1);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.beginPath();
    ctx.ellipse(sx, sy + 1, 7, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    if (p.controlled) {
      ctx.strokeStyle = "#ffe14a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(sx, sy + 1, 9, 3.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    if (p.target) {
      ctx.fillStyle = "#ffe14a";
      ctx.beginPath();
      ctx.moveTo(sx, sy - 22);
      ctx.lineTo(sx - 4, sy - 16);
      ctx.lineTo(sx + 4, sy - 16);
      ctx.fill();
    }
    const face = p.facing >= 0 ? 1 : -1;
    if (p.dive) {
      ctx.fillStyle = p.primary;
      ctx.fillRect(sx - 11, sy - 10, 22, 8);
      ctx.fillStyle = p.secondary;
      ctx.fillRect(sx + face * 8, sy - 10, 7, 7);
      if (p.hasBall) this.pig(ctx, sx + face * 6, sy - 5, 0);
      return;
    }
    const y = sy - 22 + bob;
    const step = Math.sin(this.t * 16 + p.x * 0.7) * 2;
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(sx - 5, y + 14, 4, 6 + step);
    ctx.fillRect(sx + 1, y + 14, 4, 6 - step);
    ctx.fillStyle = p.pants || "#222";
    ctx.fillRect(sx - 5, y + 10, 10, 5);
    ctx.fillStyle = p.primary;
    ctx.fillRect(sx - 6, y + 1, 12, 10);
    ctx.fillStyle = p.secondary;
    ctx.fillRect(sx - 1, y + 1, 2, 10);
    ctx.fillStyle = p.primary;
    ctx.fillRect(sx - 5, y - 6, 10, 8);
    ctx.fillStyle = p.secondary;
    ctx.fillRect(sx - 5, y - 6, 10, 2);
    ctx.fillStyle = "#d7dde8";
    ctx.fillRect(sx + face * 4, y - 4, 3, 4);
    if (p.num) {
      const n = parseInt(String(p.primary).slice(1), 16) || 0;
      const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255));
      ctx.fillStyle = lum > 170 ? "#1a1202" : "#fff";
      ctx.font = "bold 7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(p.num), sx, y + 9);
    }
    if (p.hasBall) this.pig(ctx, sx + face * 8, y + 5, this.t * 8);
  }

  ball(ctx, project, ball) {
    const [sx, sy] = project(ball.x, ball.y);
    const z = (ball.z || 0) * 7;
    if (z > 2) {
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.ellipse(sx, sy, 4, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    this.pig(ctx, sx, sy - z - 2, this.t * 10);
  }

  pig(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.fillStyle = "#6b3a16";
    ctx.fillRect(-5, -3, 10, 6);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(-1, -3, 2, 6);
    ctx.restore();
  }
}
