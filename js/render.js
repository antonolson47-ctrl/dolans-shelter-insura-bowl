/** Tecmo-style field and athletes. Integer pixels only, nearest-neighbor on the way out. */

const W = 400;
const H = 340;
const VIEW = 46;
const PX = 2;

const FONT = {
  0: ["###", "#.#", "#.#", "#.#", "###"],
  1: [".#.", "##.", ".#.", ".#.", "###"],
  2: ["###", "..#", "###", "#..", "###"],
  3: ["###", "..#", "###", "..#", "###"],
  4: ["#.#", "#.#", "###", "..#", "..#"],
  5: ["###", "#..", "###", "..#", "###"],
  6: ["###", "#..", "###", "#.#", "###"],
  7: ["###", "..#", "..#", "..#", "..#"],
  8: ["###", "#.#", "###", "#.#", "###"],
  9: ["###", "#.#", "###", "..#", "###"],
  A: [".#.", "#.#", "###", "#.#", "#.#"],
  B: ["##.", "#.#", "##.", "#.#", "##."],
  C: [".##", "#..", "#..", "#..", ".##"],
  D: ["##.", "#.#", "#.#", "#.#", "##."],
  E: ["###", "#..", "##.", "#..", "###"],
  F: ["###", "#..", "##.", "#..", "#.."],
  G: [".##", "#..", "#.#", "#.#", ".##"],
  H: ["#.#", "#.#", "###", "#.#", "#.#"],
  I: ["###", ".#.", ".#.", ".#.", "###"],
  J: ["###", "..#", "..#", "#.#", ".#."],
  K: ["#.#", "##.", "#..", "##.", "#.#"],
  L: ["#..", "#..", "#..", "#..", "###"],
  M: ["#.#", "###", "#.#", "#.#", "#.#"],
  N: ["#.#", "###", "###", "#.#", "#.#"],
  O: [".#.", "#.#", "#.#", "#.#", ".#."],
  P: ["##.", "#.#", "##.", "#..", "#.."],
  Q: [".#.", "#.#", "#.#", "###", "..#"],
  R: ["##.", "#.#", "##.", "#.#", "#.#"],
  S: [".##", "#..", ".#.", "..#", "##."],
  T: ["###", ".#.", ".#.", ".#.", ".#."],
  U: ["#.#", "#.#", "#.#", "#.#", "###"],
  V: ["#.#", "#.#", "#.#", "#.#", ".#."],
  W: ["#.#", "#.#", "#.#", "###", "#.#"],
  X: ["#.#", "#.#", ".#.", "#.#", "#.#"],
  Y: ["#.#", "#.#", ".#.", ".#.", ".#."],
  Z: ["###", "..#", ".#.", "#..", "###"],
  "-": ["...", "...", "###", "...", "..."],
};

/** 16×17 side-view athletes. O outline, H helmet, S stripe, K skin, F mask, J jersey, A sleeve, P pants, W shoe. */
const BODY = [
  "....OOOOOO......",
  "...OHHHHHHHO....",
  "...OHSSSSSHO....",
  "...OHHKKKKHHO...",
  "...OHHKFFFO.....",
  "....OHHHHO......",
  "...OJJJJJJJO....",
  "...OJJJJJJJO....",
  "...OJJJJJJJO....",
  "....OPPPPPO.....",
  "....OPPPPPO.....",
];
const ARMS = [
  ["..A.OJJJJJJO.A..", ".AA.OJJJJJJO.AA."],
  ["...AOJJJJJJJOA..", "..A.OJJJJJJO.A.."],
  [".A..OJJJJJJO..A.", "..A.OJJJJJJO.A.."],
  ["..A..JJJJJJ..A..", "..AA.JJJJJ.AA..."],
];
const LEGS = [
  ["...PP....PP.....", "..PP......PP....", ".PP........PP...", "WW..........WW..", "W............W.."],
  ["....PP..PP......", "....PP..PP......", "....PP..PP......", "....WW..WW......", "................"],
  [".....PP....PP...", "....PP......PP..", "...PP........PP.", "..WW..........WW", "..W............W"],
  [".....PPPP.......", ".....PPPP.......", ".....PPPP.......", ".....WWWW.......", "................"],
];
const RUN = LEGS.map((legs, i) => BODY.concat(ARMS[i], legs));

const DIVE = [
  "WW..............",
  ".PPPPP.JJJJHHHH.",
  "PP...P.JAJJHHHHH",
  ".PPPPP.JJJJHHFFF",
  "WW...P.JJJJHHHHH",
  "......PPPPP.HHH.",
];

for (const frame of RUN) {
  for (const row of frame) {
    if (row.length !== 16) throw new Error(`sprite row width ${row.length}: ${row}`);
  }
}
for (const row of DIVE) {
  if (row.length !== 16) throw new Error(`dive row width ${row.length}: ${row}`);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function lum(hex) {
  const n = parseInt(String(hex || "#000").slice(1), 16) || 0;
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255);
}

function shade(hex, amt) {
  const n = parseInt(String(hex || "#14662c").slice(1), 16) || 0;
  const ch = (c) => Math.max(0, Math.min(255, c + amt));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `rgb(${r},${g},${b})`;
}

function blit(ctx, dx, dy, rows, pal, scale, mirror) {
  const h = rows.length;
  const w = rows[0].length;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][mirror ? w - 1 - x : x];
      if (!ch || ch === ".") continue;
      const color = pal[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(dx + x * scale, dy + y * scale, scale, scale);
    }
  }
}

function stampNumber(ctx, dx, dy, num, scale, color) {
  const digits = String(num).slice(-2).split("");
  const gw = 3;
  const gh = 5;
  const gap = 1;
  const total = digits.length * gw + (digits.length - 1) * gap;
  const originX = Math.floor((16 - total) / 2);
  const originY = 6;
  digits.forEach((d, i) => {
    const g = FONT[d];
    if (!g) return;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        if (g[y][x] !== "#") continue;
        const px = dx + (originX + i * (gw + gap) + x) * scale;
        const py = dy + (originY + y) * scale;
        ctx.fillStyle = color;
        ctx.fillRect(px, py, scale, scale);
      }
    }
  });
}

function drawGlyphs(ctx, text, cx, cy, scale, color, turn) {
  const chars = String(text).toUpperCase().split("");
  const gw = 3;
  const gh = 5;
  const gap = 1;
  const total = chars.length * gw + Math.max(0, chars.length - 1) * gap;
  const ox = Math.round(cx - (total * scale) / 2);
  const oy = Math.round(cy - (gh * scale) / 2);
  chars.forEach((ch, i) => {
    const g = FONT[ch];
    if (!g) return;
    for (let y = 0; y < gh; y++) {
      for (let x = 0; x < gw; x++) {
        const sx = turn ? gw - 1 - x : x;
        const sy = turn ? gh - 1 - y : y;
        if (g[sy][sx] !== "#") continue;
        const px = ox + (turn ? (chars.length - 1 - i) * (gw + gap) + x : i * (gw + gap) + x) * scale;
        const py = oy + y * scale;
        ctx.fillStyle = "#07140c";
        ctx.fillRect(px - 1, py, scale + 2, scale);
        ctx.fillRect(px, py - 1, scale, scale + 2);
        ctx.fillStyle = color;
        ctx.fillRect(px, py, scale, scale);
      }
    }
  });
}

export class FieldView {
  constructor(canvas) {
    this.canvas = canvas;
    this.buf = document.createElement("canvas");
    this.buf.width = W;
    this.buf.height = H;
    this.ctx = this.buf.getContext("2d");
    this.ctx.imageSmoothingEnabled = false;
    this.t = 0;
    this.crowd = [];
    for (let i = 0; i < 180; i++) {
      this.crowd.push({
        x: (i * 37) % W,
        y: 4 + (i % 7) * 3,
        c: ["#1a3058", "#4a2a22", "#143d28", "#3a1830", "#243458"][i % 5],
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
    ctx.imageSmoothingEnabled = false;
    const flip = !!snap.flip;
    const fx = (x) => (flip ? 100 - x : x);
    const ballX = snap.ball ? fx(snap.ball.x) : fx(snap.los || 25);
    let cam = ballX - 16;
    cam = clamp(cam, -14, 114 - VIEW);
    const project = (x, y) => {
      const sx = ((fx(x) - cam) / VIEW) * W;
      const sy = 34 + (y / 30) * (H - 48);
      return [sx, sy];
    };
    const ix = (x) => Math.round(project(x, 0)[0]);

    ctx.save();
    if (snap.shake > 0.4) {
      const s = Math.round(snap.shake);
      ctx.translate((Math.random() < 0.5 ? -s : s), (Math.random() < 0.5 ? -1 : 1));
    }

    ctx.fillStyle = "#071226";
    ctx.fillRect(0, 0, W, H);
    for (const c of this.crowd) {
      const wave = Math.sin(this.t * 3 + c.x * 0.05) > 0.35 ? -1 : 0;
      ctx.fillStyle = c.c;
      ctx.fillRect(c.x, c.y + wave, 3, 3);
    }
    ctx.fillStyle = "#d5e2f5";
    ctx.fillRect(10, 2, 14, 8);
    ctx.fillRect(W - 24, 2, 14, 8);
    ctx.fillStyle = "#ffe14a";
    ctx.fillRect(8, 10, 18, 3);
    ctx.fillRect(W - 26, 10, 18, 3);

    const grassTop = 32;
    const grassH = H - 40;
    for (let yard = -10; yard < 110; yard += 5) {
      const left = Math.min(ix(yard), ix(yard + 5));
      const right = Math.max(ix(yard), ix(yard + 5));
      let color;
      if (yard < 0) color = shade(snap.player.color, -35);
      else if (yard >= 100) color = shade(snap.cpu.color, -35);
      else color = Math.floor((yard + 10) / 5) % 2 === 0 ? "#0c5e2c" : "#157a38";
      ctx.fillStyle = color;
      ctx.fillRect(left, grassTop, right - left + 1, grassH);
    }

    ctx.fillStyle = "#f4f6f8";
    ctx.fillRect(0, grassTop, W, 3);
    ctx.fillRect(0, grassTop + grassH - 3, W, 3);

    for (let yard = 0; yard <= 100; yard += 1) {
      const x = ix(yard);
      if (yard % 5 === 0) {
        const thick = yard === 0 || yard === 100 ? 4 : 3;
        ctx.fillStyle = "#f7f7f2";
        ctx.fillRect(x - Math.floor((thick - 1) / 2), grassTop, thick, grassH);
      } else {
        const y1 = grassTop + Math.round(grassH * 0.34);
        const y2 = grassTop + Math.round(grassH * 0.62);
        ctx.fillStyle = "#f7f7f2";
        ctx.fillRect(x, y1, 2, 6);
        ctx.fillRect(x, y2, 2, 6);
      }
    }

    for (let yard = 10; yard < 100; yard += 10) {
      const label = yard === 50 ? "50" : String(Math.min(yard, 100 - yard));
      const x = Math.round((ix(yard) + ix(Math.min(100, yard + 10))) / 2);
      drawGlyphs(ctx, label, x, grassTop + 36, 3, "#ffffff", false);
      drawGlyphs(ctx, label, x, grassTop + grassH - 36, 3, "#ffffff", true);
    }

    this.endZoneLabel(ctx, project, -5, snap.player.abbr, lum(snap.player.color) > 150 ? "#1a1202" : "#fff");
    this.endZoneLabel(ctx, project, 105, snap.cpu.abbr, lum(snap.cpu.color) > 150 ? "#1a1202" : "#fff");
    this.goalPost(ctx, project, 0);
    this.goalPost(ctx, project, 100);

    if (snap.phase === "live" || snap.phase === "playcall" || snap.phase === "fg") {
      ctx.fillStyle = "#7ec8ff";
      ctx.fillRect(ix(snap.los) - 1, grassTop, 2, grassH);
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(ix(snap.chains) - 1, grassTop, 3, grassH);
    }

    let guys = [...(snap.players || [])];
    if (snap.phase === "playcall" && guys.length === 0) guys = this.preview(snap);
    guys.sort((a, b) => a.y - b.y);
    for (const p of guys) this.player(ctx, project, p, snap.phase === "live", flip);
    if (snap.ball && snap.ball.mode !== "dead") this.ball(ctx, project, snap.ball);

    ctx.restore();

    const out = this.canvas.getContext("2d");
    this.resize();
    out.imageSmoothingEnabled = false;
    out.fillStyle = "#061018";
    out.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const dw = this.canvas.width;
    const dh = Math.round((H * dw) / W);
    out.drawImage(this.buf, 0, 0, dw, Math.min(this.canvas.height, dh));
  }

  endZoneLabel(ctx, project, worldX, text, color) {
    const [sx, sy] = project(worldX, 15);
    if (sx < -40 || sx > W + 40) return;
    drawGlyphs(ctx, text || "", sx, sy, 3, color, false);
  }

  goalPost(ctx, project, worldX) {
    const [sx, syTop] = project(worldX, 9);
    const [, syBot] = project(worldX, 21);
    const foot = project(worldX, 15)[1];
    const top = Math.min(syTop, syBot) - 26;
    const bot = Math.max(syTop, syBot);
    ctx.fillStyle = "#f5c518";
    ctx.fillRect(Math.round(sx) - 1, Math.round(top), 3, Math.round(foot - top));
    ctx.fillRect(Math.round(sx) - 1, Math.round(top), 3, Math.round(bot - top));
    ctx.fillRect(Math.round(sx) - 1, Math.round(top), 3, 3);
    ctx.fillRect(Math.round(sx) - 8, Math.round(top), 18, 3);
    ctx.fillRect(Math.round(sx) - 8, Math.round(top), 3, 14);
    ctx.fillRect(Math.round(sx) + 6, Math.round(top), 3, 14);
  }

  preview(snap) {
    const dir = snap.offense === "cpu" ? -1 : 1;
    const off = snap.offense === "player" ? snap.player : snap.cpu;
    const def = snap.offense === "player" ? snap.cpu : snap.player;
    const ys = [5, 10, 14, 16, 20, 25];
    return ys.map((y, i) => ({
      x: snap.los + dir * (i === 2 ? -5.2 : -1.2),
      y,
      role: i === 2 ? "QB" : "OL",
      num: i === 2 ? 7 : 0,
      facing: dir,
      hasBall: i === 2,
      primary: off.color,
      secondary: "#f4f4f4",
      pants: "#24180f",
      accent: off.color,
      helmet: off.color,
    })).concat(ys.map((y) => ({
      x: snap.los + dir * 1.7,
      y,
      role: "DL",
      num: 0,
      facing: -dir,
      hasBall: false,
      primary: def.color,
      secondary: "#111",
      pants: "#24180f",
      accent: "#111",
      helmet: def.color,
    })));
  }

  player(ctx, project, p, animate, flip) {
    const [sx0, sy0] = project(p.x, p.y);
    const sx = Math.round(sx0);
    const sy = Math.round(sy0);
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(sx - 8, sy - 2, 16, 3);
    if (p.controlled) {
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(sx - 10, sy - 3, 20, 2);
      ctx.fillRect(sx - 10, sy, 3, 2);
      ctx.fillRect(sx + 7, sy, 3, 2);
    }
    if (p.target) {
      ctx.fillStyle = "#ffe14a";
      ctx.fillRect(sx - 2, sy - 46, 4, 6);
      ctx.fillRect(sx - 5, sy - 40, 10, 3);
    }
    const worldFacing = p.facing || 1;
    const screenFacing = flip ? -worldFacing : worldFacing;
    const mirror = screenFacing < 0;
    const pal = {
      O: "#070707",
      H: p.helmet || p.primary,
      S: p.secondary || "#fff",
      K: "#e2b48a",
      F: "#dfe5ef",
      J: p.primary,
      A: p.accent || p.secondary || p.primary,
      P: p.pants || "#222",
      W: "#f4f4f4",
    };
    if (p.dive) {
      blit(ctx, sx - 16, sy - 16, DIVE, pal, PX, mirror);
      if (p.hasBall) this.pig(ctx, sx + (mirror ? -10 : 8), sy - 8, 0);
      return;
    }
    const frame = animate ? Math.floor(this.t * 8 + p.x * 1.7) % RUN.length : 0;
    const rows = RUN[frame];
    const h = rows.length * PX;
    const top = sy - h + 2;
    blit(ctx, sx - 16, top, rows, pal, PX, mirror);
    if (p.num) {
      const numColor = lum(p.primary) > 160 ? "#161616" : "#ffffff";
      stampNumber(ctx, sx - 16, top, p.num, PX, numColor);
    }
    if (p.hasBall) this.pig(ctx, sx + (mirror ? -14 : 12), sy - 16, this.t * 8);
  }

  ball(ctx, project, ball) {
    const [sx0, sy0] = project(ball.x, ball.y);
    const sx = Math.round(sx0);
    const sy = Math.round(sy0);
    const z = Math.round((ball.z || 0) * 8);
    if (z > 2) {
      ctx.fillStyle = "rgba(0,0,0,.35)";
      ctx.fillRect(sx - 4, sy - 1, 8, 2);
    }
    this.pig(ctx, sx, sy - z - 4, this.t * 10);
  }

  pig(ctx, x, y, rot) {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.rotate(rot);
    ctx.fillStyle = "#5a3012";
    ctx.fillRect(-5, -3, 10, 6);
    ctx.fillStyle = "#f2f2f2";
    ctx.fillRect(-1, -3, 2, 6);
    ctx.restore();
  }
}
