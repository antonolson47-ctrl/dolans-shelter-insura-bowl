/** Arcade football. Offense is a real-time Tecmo drive: short quarters, big plays. */

export const QUARTER_SECONDS = 180;

const BASE = {
  QB: 6.8, RB: 9.5, WR: 10.9, TE: 8.2, OL: 5.4,
  DL: 7.0, LB: 7.5, DB: 8.15, RET: 10.2, GUN: 7.7, K: 5,
};

export function fmtClock(s) {
  const t = Math.max(0, Math.ceil(s));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
}

export function bigMoment({ td, hail, pick, bomb, crunch, safety, fg } = {}) {
  if (hail && td) return { main: "HAIL CLAIM", sub: "TOUCHDOWN" };
  if (pick && td) return { main: "PICK-SIX", sub: "TOUCHDOWN" };
  if (bomb && td) return { main: "BOMB", sub: "TOUCHDOWN" };
  if (td) return { main: "TOUCHDOWN", sub: "" };
  if (safety) return { main: "SAFETY", sub: "" };
  if (fg) return { main: "FIELD GOAL", sub: "" };
  if (crunch) return { main: "CRUNCH", sub: "" };
  return null;
}

function mulberry32(a) {
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const other = (t) => (t === "player" ? "cpu" : "player");

function modsFor(off, def) {
  const run = off === "dive" || off === "sweep";
  if (def === "stuff") return { rush: run ? 1.32 : 0.8, cover: run ? 0.75 : 0.7, deep: run ? 6 : 7.5 };
  if (def === "blitz") return { rush: 1.58, cover: 0.58, deep: 8 };
  if (def === "zone") return { rush: 0.9, cover: 1.02, deep: 16 };
  if (def === "man") return { rush: 1.02, cover: 1.3, deep: 5.2 };
  return { rush: 1, cover: 1, deep: 10 };
}

function emptyStats() {
  return { pass: 0, rush: 0, tds: 0, ints: 0, sacks: 0, fg: 0, punts: 0 };
}

export class Game {
  constructor(cfg) {
    this.player = cfg.player;
    this.cpu = cfg.cpu;
    this.bot = !!cfg.bot;
    this.rand = mulberry32(cfg.seed ?? (Math.floor(Math.random() * 1e9) + 1));
    this.reasons = {};
    this.sfxQ = [];
    this.reset(cfg.receive !== false);
  }

  reset(receive) {
    this.scores = { player: 0, cpu: 0 };
    this.stats = { player: emptyStats(), cpu: emptyStats() };
    this.quarter = 1;
    this.clock = QUARTER_SECONDS;
    this.half = 1;
    this.ot = false;
    this.otRounds = 0;
    this.timeouts = { player: 3, cpu: 3 };
    this.offense = "player";
    this.dir = 1;
    this.los = 25;
    this.down = 1;
    this.toGo = 10;
    this.chains = 35;
    this.players = [];
    this.ball = { mode: "dead", x: 25, y: 15, z: 0, carrier: null };
    this.phase = "pregame";
    this.phaseT = 0;
    this.nextStep = null;
    this.deferred = null;
    this.play = null;
    this.playTime = 0;
    this.playClock = 16;
    this.clockRunning = false;
    this.expired = false;
    this.twoMin = false;
    this.pendingTwoMin = false;
    this.twoPt = false;
    this.patFor = null;
    this.kickReceiver = receive ? "player" : "cpu";
    this.openingReceiver = this.kickReceiver;
    this.safetyKick = false;
    this.banner = null;
    this.note = "";
    this.noteT = 0;
    this.shake = 0;
    this.slow = 0;
    this.cue = null;
    this.fg = null;
    this.cpuPlan = null;
    this.targets = [];
    this.targetIndex = 0;
    this.controlledId = 0;
    this.pid = 1;
    this.drive = null;
    this.threeStreak = 0;
    this.mods = modsFor("slant", "zone");
    this.clockAtSnap = this.clock;
  }

  start(receive = true) {
    this.reset(receive);
    this.kickReceiver = receive ? "player" : "cpu";
    this.openingReceiver = this.kickReceiver;
    this.banner = { main: "KICKOFF", sub: receive ? "YOU RECEIVE" : "YOU KICK", t: 1.3 };
    this.phase = "celebrate";
    this.phaseT = 1.15;
    this.nextStep = "kickoff";
    this.sfx("whistle");
  }

  sfx(name) { this.sfxQ.push(name); }
  mark(r) { this.reasons[r] = (this.reasons[r] || 0) + 1; }

  setBanner(main, sub = "", t = 1.45) {
    this.banner = { main, sub, t };
  }

  teamDef(side) { return side === "player" ? this.player : this.cpu; }

  speedOf(role, side) {
    const rating = this.teamDef(side).rating || 75;
    const scale = 0.9 + (rating - 70) * 0.0045;
    return (BASE[role] || 7.2) * scale * (0.95 + this.rand() * 0.08);
  }

  dist(a, b) { return Math.hypot((a.x || 0) - (b.x || 0), (a.y || 0) - (b.y || 0)); }

  distToGoal(from = this.los) {
    return this.dir === 1 ? 100 - from : from;
  }

  spotText(x = this.los, offense = this.offense) {
    const own = offense === "player" ? x : 100 - x;
    const o = Math.round(own);
    if (o >= 49 && o <= 51) return "MIDFIELD";
    if (o <= 50) return `OWN ${Math.max(1, o)}`;
    return `OPP ${Math.max(1, 100 - o)}`;
  }

  downText() {
    if (this.play && this.phase === "live" && (this.play.kind === "kickoff" || this.play.kind === "punt")) {
      return this.play.kind === "kickoff" ? "KICKOFF" : "PUNT";
    }
    if (this.twoPt && this.phase !== "celebrate") return "2-PT TRY";
    const names = ["", "1ST", "2ND", "3RD", "4TH"];
    const tg = Math.max(1, Math.ceil(this.toGo));
    const ytg = Math.ceil(this.distToGoal());
    return `${names[this.down] || "1ST"} & ${tg >= ytg ? "GOAL" : tg}`;
  }

  fgDistance() {
    const snap = this.los - this.dir * 7;
    const posts = this.dir === 1 ? 110 : -10;
    return Math.round(Math.abs(posts - snap));
  }

  visualFlip() {
    const carrier = this.ball && this.ball.carrier;
    if (this.phase === "live" && this.ball && this.ball.mode === "air" && this.play) {
      return this.play.offense === "cpu";
    }
    if (this.phase === "live" && carrier) return carrier.team === "cpu";
    return this.offense === "cpu";
  }

  update(dt, input) {
    dt = clamp(dt || 0.016, 0, 0.05);
    if (this.slow > 0) {
      this.slow -= dt;
      dt *= 0.42;
    }
    if (this.banner) this.banner.t -= dt;
    if (this.noteT > 0) this.noteT -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 16);

    if (this.bot) {
      if (this.phase === "playcall") this.hike(null);
      else if (this.phase === "pat") this.choosePat(this.patFor === "cpu" ? this.cpuPatChoice() : "kick");
      else if (this.phase === "celebrate" || this.phase === "quarter" || this.phase === "halftime") this.advance();
    }

    if (this.phase === "live") this.tickLive(dt, this.bot ? this.botInput() : (input || blankInput()));
    else if (this.phase === "playcall") this.tickPlaycall(dt);
    else if (this.phase === "fg") this.tickFG(dt);
    else if (this.phase === "pat") this.tickPat(dt);
    else if (this.phase === "celebrate" || this.phase === "quarter" || this.phase === "halftime") {
      this.phaseT -= dt;
      if (this.phaseT <= 0) this.advance();
    }
  }

  advance() {
    if (this.phase !== "celebrate" && this.phase !== "quarter" && this.phase !== "halftime") return;
    const n = this.nextStep;
    this.nextStep = null;
    this.phase = "transition";
    this.go(n);
  }

  go(n) {
    if (n === "playcall") this.startPlaycall();
    else if (n === "kickoff") this.beginKickoff();
    else if (n === "pat") this.beginPat();
    else if (n === "quarter") this.beginQuarter();
    else if (n === "halftime") this.beginHalf();
    else if (n === "ot" || n === "otbanner") this.beginOT();
    else if (n === "final") this.phase = "final";
    else this.startPlaycall();
  }

  beginQuarter() {
    this.quarter += 1;
    this.clock = QUARTER_SECONDS;
    this.expired = false;
    this.clockRunning = false;
    if (this.quarter === 2 || this.quarter === 4) this.twoMin = false;
    this.phase = "quarter";
    this.phaseT = 1.5;
    this.nextStep = this.deferred || "playcall";
    this.deferred = null;
    this.setBanner(`Q${this.quarter}`, "READY");
  }

  beginHalf() {
    this.quarter = 3;
    this.clock = QUARTER_SECONDS;
    this.expired = false;
    this.half = 2;
    this.timeouts = { player: 3, cpu: 3 };
    this.clockRunning = false;
    this.twoMin = false;
    this.phase = "halftime";
    this.phaseT = 2.3;
    this.kickReceiver = this.openingReceiver === "player" ? "cpu" : "player";
    this.nextStep = "kickoff";
    this.deferred = null;
    this.setBanner("HALFTIME", `${this.scores.player}–${this.scores.cpu}`);
    this.sfx("whistle");
  }

  beginOT() {
    this.ot = true;
    this.quarter = 5;
    this.clock = 120;
    this.expired = false;
    this.clockRunning = false;
    this.phase = "celebrate";
    this.phaseT = 1.35;
    this.kickReceiver = this.openingReceiver === "player" ? "cpu" : "player";
    this.nextStep = "kickoff";
    this.setBanner("OVERTIME", "FIRST SCORE WINS");
    this.sfx("whistle");
  }

  startPlaycall() {
    this.phase = "playcall";
    this.play = null;
    this.players = [];
    this.ball.mode = "dead";
    this.ball.carrier = null;
    this.dir = this.offense === "player" ? 1 : -1;
    this.toGo = Math.min(Math.max(this.toGo, 0.5), this.distToGoal());
    if (this.down === 1) this.toGo = Math.min(10, this.distToGoal());
    this.chains = this.los + this.dir * this.toGo;
    this.playClock = this.twoPt ? 10 : 16;
    this.cpuPlan = this.offense === "cpu" ? this.cpuOffPick() : null;
    if (this.cpuPlan === "fg" || this.cpuPlan === "punt") {
      this.note = this.cpuPlan === "fg" ? "THEY'RE KICKING A FIELD GOAL" : "THEY'RE LINING UP TO PUNT";
      this.noteT = 3;
    }
    if (this.offense === "cpu" && this.quarter >= 4 && this.clock < 40 && this.clockRunning
      && this.scores.cpu < this.scores.player && this.timeouts.cpu > 0 && this.rand() < 0.8) {
      this.timeout("cpu");
    }
  }

  timeout(side) {
    if (this.phase !== "playcall") return false;
    if (!this.timeouts[side]) return false;
    this.timeouts[side] -= 1;
    this.clockRunning = false;
    this.playClock = Math.max(this.playClock, 12);
    this.setBanner("TIMEOUT", side === "player" ? "YOUR TIMEOUT" : "THEIR TIMEOUT", 1);
    this.sfx("whistle");
    return true;
  }

  tickPlaycall(dt) {
    if (this.clockRunning) {
      this.clock -= dt * 2.5;
      if (this.clock < 0) this.clock = 0;
    }
    this.checkTwoMin();
    this.playClock -= dt;
    if (this.clock <= 0) {
      this.expired = true;
      this.breakForClock("playcall");
      return;
    }
    if (this.playClock <= 0) this.hike(null);
  }

  breakForClock(resume) {
    const next = this.periodGate(resume);
    this.phase = "celebrate";
    this.phaseT = 0.35;
    this.nextStep = next;
    if (next === "final") this.phase = "final";
  }

  checkTwoMin() {
    if (this.twoMin) return;
    if ((this.quarter === 2 || this.quarter === 4) && this.clock <= 120 && this.clock > 0) {
      this.twoMin = true;
      this.clockRunning = false;
      this.pendingTwoMin = false;
      this.setBanner("TWO-MINUTE WARNING", "");
      this.sfx("whistle");
    }
  }

  periodGate(resume) {
    if (this.clock > 0 && !this.expired) return resume;
    this.expired = false;
    this.deferred = resume;
    if (this.ot) {
      this.otRounds += 1;
      if (this.otRounds >= 3) {
        const py = this.stats.player.pass + this.stats.player.rush;
        const cy = this.stats.cpu.pass + this.stats.cpu.rush;
        if (py >= cy) this.scores.player += 3;
        else this.scores.cpu += 3;
        this.mark("ot-force");
        return "final";
      }
      this.clock = 90;
      this.deferred = "kickoff";
      return "otbanner";
    }
    if (this.quarter === 2) return "halftime";
    if (this.quarter >= 4) {
      if (this.scores.player === this.scores.cpu) return "ot";
      return "final";
    }
    return "quarter";
  }

  cpuOffPick() {
    if (this.twoPt) return this.rand() < 0.55 ? "dive" : "slant";
    const ytg = this.distToGoal();
    const dist = this.fgDistance();
    if (this.down === 4) {
      if (ytg <= 2) return "dive";
      if (dist <= 56 && ytg <= 38) return "fg";
      if (this.toGo <= 1.5 && ytg < 45) return this.rand() < 0.5 ? "dive" : "slant";
      if (dist <= 48 && this.toGo > 3) return "fg";
      return "punt";
    }
    const trailing = this.scores[this.offense] + 3 < this.scores[other(this.offense)];
    if ((this.quarter >= 4 || this.ot) && this.clock < 28 && ytg > 25 && trailing) return "bomb";
    const r = this.rand();
    if (this.toGo >= 7 && r < 0.4) return "bomb";
    if (this.toGo >= 4 && r < 0.62) return r < 0.5 ? "post" : "slant";
    if (r < 0.3) return this.rand() < 0.5 ? "dive" : "sweep";
    if (r < 0.48) return "screen";
    if (r < 0.75) return "slant";
    return "post";
  }

  cpuDefPick() {
    const r = this.rand();
    if (r < 0.24) return "stuff";
    if (r < 0.5) return "zone";
    if (r < 0.76) return "man";
    return "blitz";
  }

  cpuPatChoice() {
    const me = this.scores[this.patFor];
    const them = this.scores[other(this.patFor)];
    const deficit = them - me;
    if (deficit === 2 || deficit === 5 || deficit === 10 || deficit === 16) return "two";
    return "kick";
  }

  hike(choice) {
    if (this.phase !== "playcall") return;
    if (this.offense === "cpu") {
      const off = this.cpuPlan || this.cpuOffPick();
      if (!this.twoPt && off === "fg") { this.beginFG({ pat: false, team: "cpu" }); return; }
      if (!this.twoPt && off === "punt") { this.beginPunt(); return; }
      const def = choice || "zone";
      this.beginScrimmage(off === "fg" || off === "punt" ? "dive" : off, def);
      return;
    }
    const off = choice || this.cpuOffPick();
    if (!this.twoPt && off === "fg") { this.beginFG({ pat: false, team: "player" }); return; }
    if (!this.twoPt && off === "punt") { this.beginPunt(); return; }
    this.beginScrimmage(off, this.cpuDefPick());
  }

  beginPat() {
    this.phase = "pat";
    this.phaseT = 0;
  }

  choosePat(which) {
    if (this.phase !== "pat") return;
    if (which === "two") { this.beginTwoPt(); return; }
    this.beginFG({ pat: true, team: this.patFor });
  }

  tickPat(dt) {
    this.phaseT += dt;
    if (this.patFor === "cpu" && this.phaseT > 0.45) this.choosePat(this.cpuPatChoice());
    else if (this.bot && this.phaseT > 0.15) this.choosePat("kick");
    else if (this.phaseT > 12) this.choosePat("kick");
  }

  beginTwoPt() {
    this.twoPt = true;
    this.offense = this.patFor;
    this.dir = this.offense === "player" ? 1 : -1;
    this.los = this.dir === 1 ? 98 : 2;
    this.down = 1;
    this.toGo = 2;
    this.chains = this.dir === 1 ? 100 : 0;
    this.clockRunning = false;
    this.phase = "playcall";
    this.playClock = 10;
    this.cpuPlan = this.offense === "cpu" ? this.cpuOffPick() : null;
    this.note = "GOING FOR TWO";
    this.noteT = 2;
  }

  beginFG({ pat, team }) {
    const dist = pat ? 33 : this.fgDistance();
    this.phase = "fg";
    this.fg = { dist, pat: !!pat, team, t: 0, meter: 0.5, resolved: false };
    this.sfx("whistle");
  }

  tickFG(dt) {
    if (!this.fg || this.fg.resolved) return;
    this.fg.t += dt;
    const period = clamp(1.5 - this.fg.dist / 90, 0.62, 1.5);
    this.fg.meter = 0.5 + 0.5 * Math.sin((this.fg.t * Math.PI * 2) / period);
    if ((this.fg.team === "cpu" || this.bot) && this.fg.t > 0.5) this.lockKick();
  }

  lockKick() {
    if (this.phase !== "fg" || !this.fg || this.fg.resolved) return;
    this.fg.resolved = true;
    let good;
    if (this.fg.team === "cpu" || this.bot) {
      const skill = this.teamDef(this.fg.team).rating || 75;
      let chance = 0.94 - Math.max(0, this.fg.dist - 30) * 0.013 + (skill - 78) * 0.003;
      if (this.fg.pat) chance = 0.97;
      good = this.rand() < clamp(chance, 0.3, 0.98);
    } else {
      const err = Math.abs(this.fg.meter - 0.5);
      const window = clamp(0.2 - Math.max(0, this.fg.dist - 28) * 0.003, 0.065, 0.22);
      good = err <= window;
    }
    this.resolveFG(good);
  }

  resolveFG(good) {
    const team = this.fg.team;
    const pat = this.fg.pat;
    if (good) {
      this.scores[team] += pat ? 1 : 3;
      if (!pat) this.stats[team].fg += 1;
      this.sfx("fg");
      this.mark(pat ? "pat" : "fg");
    } else {
      this.sfx("miss");
      this.mark(pat ? "pat-miss" : "fg-miss");
    }
    if (this.ot && good && !pat) {
      this.finish("final", { main: "FIELD GOAL", sub: "SUDDEN DEATH" }, {
        bucket: "fg_good", celebrate: team === "player", negative: team !== "player",
      });
      return;
    }
    if (pat) {
      const cue = good
        ? { bucket: "fg_good", celebrate: team === "player", negative: team !== "player" }
        : { bucket: team === "player" ? "fg_miss" : "crushing", negative: team === "player", celebrate: team !== "player" };
      this.kickReceiver = other(this.patFor);
      const banner = good ? { main: "EXTRA POINT", sub: "GOOD" } : { main: "NO GOOD", sub: "" };
      this.finish(this.periodGate("kickoff"), banner, cue);
      return;
    }
    if (good) {
      this.kickReceiver = other(team);
      this.finish(this.periodGate("kickoff"), { main: "FIELD GOAL", sub: `${this.fg.dist} YDS` }, {
        bucket: "fg_good", celebrate: team === "player", negative: team !== "player",
      });
      return;
    }
    const snap = clamp(this.los - this.dir * 7, 1, 99);
    const kicker = team;
    this.offense = kicker;
    this.flipPossession(snap);
    this.finish(this.periodGate("playcall"), { main: "NO GOOD", sub: "" }, {
      bucket: kicker === "player" ? "fg_miss" : "crushing",
      negative: kicker === "player",
      celebrate: kicker !== "player",
    });
  }

  flipPossession(x) {
    this.offense = other(this.offense);
    this.los = clamp(x, 1, 99);
    this.dir = this.offense === "player" ? 1 : -1;
    this.down = 1;
    this.toGo = Math.min(10, this.distToGoal());
    this.chains = this.los + this.dir * this.toGo;
    this.clockRunning = false;
    this.startDrive();
  }

  startDrive() {
    this.drive = {
      offense: this.offense,
      plays: 0,
      firstDowns: 0,
      gain: 0,
      start: this.los,
    };
  }

  threeAndOut() {
    const d = this.drive;
    if (!d || d.offense !== "player") return false;
    const bad = d.plays >= 3 && d.plays <= 4 && d.firstDowns === 0 && d.gain < 4;
    if (bad) { this.threeStreak += 1; return true; }
    this.threeStreak = 0;
    return false;
  }

  beginKickoff() {
    const recv = this.kickReceiver || "player";
    const kick = other(recv);
    const playerRecv = recv === "player";
    let fromX = playerRecv ? 64 : 36;
    let land = playerRecv ? 6 + this.rand() * 22 : 72 + this.rand() * 22;
    if (this.safetyKick) {
      fromX = playerRecv ? 78 : 22;
      land = playerRecv ? 28 + this.rand() * 22 : 50 + this.rand() * 22;
      this.safetyKick = false;
    }
    const deep = playerRecv ? land < 7 : land > 93;
    this.offense = kick;
    this.dir = kick === "player" ? 1 : -1;
    this.phase = "live";
    this.playTime = 0;
    this.clockRunning = false;
    this.clockAtSnap = this.clock;
    this.play = {
      kind: "kickoff", name: "KICKOFF", offense: kick, dir: this.dir,
      los: this.los, chains: this.chains, thrown: false, handed: false,
      twoPt: false, caught: false, bomb: false, picked: false, airDist: 0,
      fumbleBy: null, turnoverLive: false,
    };
    this.players = [];
    this.spawnCoverage(kick, fromX, playerRecv ? -1 : 1);
    this.spawnReturn(recv, deep ? (playerRecv ? 8 : 92) : land);
    this.ball = {
      mode: "air", kick: true, punt: false, touchback: deep,
      x: fromX, y: 15, z: 3, u: 0,
      fromX, fromY: 15, toX: land, toY: 10 + this.rand() * 10,
      flight: 1.85, carrier: null, target: null, airDist: Math.abs(land - fromX),
    };
    this.controlledId = (this.players.find((p) => p.role === "RET" && p.team === "player")
      || this.players.find((p) => p.team === "player"))?.id || 0;
    this.sfx("kick");
    this.mark("kickoff");
  }

  beginPunt() {
    const kicking = this.offense;
    const recv = other(kicking);
    const three = this.threeAndOut();
    this.stats[kicking].punts += 1;
    const dir = kicking === "player" ? 1 : -1;
    const fromX = this.los;
    const land = fromX + dir * (34 + this.rand() * 14);
    const touchback = dir === 1 ? land >= 100 : land <= 0;
    this.phase = "live";
    this.playTime = 0;
    this.clockRunning = false;
    this.clockAtSnap = this.clock;
    this.play = {
      kind: "punt", name: "PUNT", offense: kicking, dir, los: this.los, chains: this.chains,
      thrown: false, handed: false, twoPt: false, caught: false, bomb: false, picked: false,
      airDist: Math.abs(land - fromX), fumbleBy: null, turnoverLive: false, three,
    };
    this.players = [];
    this.spawnCoverage(kicking, fromX, dir);
    this.spawnReturn(recv, touchback ? (recv === "player" ? 20 : 80) : clamp(land, 2, 98));
    this.ball = {
      mode: "air", kick: true, punt: true, touchback,
      x: fromX, y: 15, z: 2, u: 0,
      fromX, fromY: 15, toX: clamp(land, -1, 101), toY: 8 + this.rand() * 14,
      flight: 1.45, carrier: null, target: null, airDist: Math.abs(land - fromX),
    };
    this.controlledId = (this.players.find((p) => p.role === "RET" && p.team === "player")
      || this.players.find((p) => p.team === "player"))?.id || 0;
    this.sfx("kick");
    this.mark("punt");
  }

  beginScrimmage(off, def) {
    this.dir = this.offense === "player" ? 1 : -1;
    this.mods = modsFor(off, def);
    this.phase = "live";
    this.playTime = 0;
    this.clockRunning = true;
    this.clockAtSnap = this.clock;
    const kind = off === "dive" || off === "sweep" ? "run" : "pass";
    this.play = {
      kind, name: off.toUpperCase(), off, def, offense: this.offense, dir: this.dir,
      los: this.los, chains: this.chains, thrown: false, handed: false,
      twoPt: !!this.twoPt, caught: false, bomb: false, picked: false, airDist: 0,
      fumbleBy: null, turnoverLive: false,
    };
    this.players = [];
    this.spawnOffense(off);
    this.spawnDefense(def);
    const qb = this.players.find((p) => p.role === "QB" && p.team === this.offense);
    this.giveBall(qb);
    this.targets = this.collectTargets(off);
    this.targetIndex = 0;
    const userDef = this.players.find((p) => p.team === "player" && p.role === "LB")
      || this.players.find((p) => p.team === "player" && p.role !== "OL");
    this.controlledId = this.offense === "player" ? (qb ? qb.id : 0) : (userDef ? userDef.id : 0);
    this.note = `${off.toUpperCase()} vs ${def.toUpperCase()}`;
    this.noteT = 1.35;
    this.sfx("hike");
    this.mark(`play-${off}`);
    if (!this.drive || this.drive.offense !== this.offense) this.startDrive();
  }

  px(depth, y) {
    return { x: this.los + this.dir * depth, y };
  }

  make(side, role, x, y, num, name) {
    const t = this.teamDef(side);
    const p = {
      id: this.pid++,
      team: side,
      role, num: num || 0, name: name || role,
      x, y, vx: 0, vy: 0,
      speed: this.speedOf(role === "GUN" ? "GUN" : role, side),
      facing: side === "player" ? 1 : -1,
      hasBall: false,
      dive: 0, juke: 0, stiff: 0, stun: 0, blocked: 0, blockTime: 0,
      assignment: null,
      primary: t.primary, secondary: t.secondary, pants: t.pants || t.secondary,
    };
    this.players.push(p);
    return p;
  }

  guy(side, role, which = 0) {
    const roster = this.teamDef(side).roster || [];
    const matches = roster.filter((r) => r.role === role);
    return matches[which] || matches[0] || { num: 10 + which, name: role };
  }

  spawnOffense(off) {
    const s = this.offense;
    const qb = this.guy(s, "QB");
    const rb = this.guy(s, "RB");
    const wr1 = this.guy(s, "WR", 0);
    const wr2 = this.guy(s, "WR", 1);
    const te = this.guy(s, "TE");
    const qbp = this.px(-4.2, 15);
    const rbp = this.px(off === "sweep" ? -5.5 : -7, off === "sweep" ? 11 : 15);
    this.make(s, "OL", this.px(-0.4, 12).x, 12, 70, "OL");
    this.make(s, "OL", this.px(-0.4, 18).x, 18, 71, "OL");
    this.make(s, "QB", qbp.x, qbp.y, qb.num, qb.name);
    this.make(s, "RB", rbp.x, rbp.y, rb.num, rb.name);
    this.make(s, "WR", this.px(0.4, 3.2).x, 3.2, wr1.num, wr1.name);
    this.make(s, "WR", this.px(0.4, 26.8).x, 26.8, wr2.num, wr2.name);
    this.make(s, "TE", this.px(0.3, 21).x, 21, te.num, te.name);
    this.assignRoutes(off);
  }

  spawnDefense(def) {
    const s = other(this.offense);
    const deep = this.mods.deep;
    const lbDepth = def === "stuff" ? 2.4 : def === "blitz" ? 1.2 : def === "zone" ? 6 : 4.2;
    this.make(s, "DL", this.px(1.1, 12).x, 12, 90, "DL");
    this.make(s, "DL", this.px(1.1, 18).x, 18, 91, "DL");
    const lb1 = this.make(s, "LB", this.px(lbDepth, 10).x, 10, 54, "LB");
    const lb2 = this.make(s, "LB", this.px(def === "blitz" ? 4.5 : lbDepth, 20).x, 20, 55, "LB");
    this.make(s, "DB", this.px(deep, 3.4).x, 3.4, 21, "CB");
    this.make(s, "DB", this.px(deep, 26.5).x, 26.5, 24, "CB");
    const rush = def === "blitz";
    lb1.assignment = { type: rush ? "rush" : def === "stuff" ? "fit" : "zone", y: 12 };
    lb2.assignment = { type: def === "zone" ? "zone" : def === "stuff" ? "fit" : "fit", y: 20 };
    const dbs = this.players.filter((p) => p.team === s && p.role === "DB");
    const wrs = this.players.filter((p) => p.team === this.offense && (p.role === "WR" || p.role === "TE"));
    dbs.forEach((db, i) => {
      db.assignment = { type: def === "zone" ? "zone" : "man", targetId: wrs[i] ? wrs[i].id : 0, y: db.y };
    });
    this.players.filter((p) => p.team === s && p.role === "DL").forEach((dl) => {
      dl.assignment = { type: "rush" };
    });
  }

  assignRoutes(off) {
    const wrs = this.players.filter((p) => p.team === this.offense && p.role === "WR");
    const te = this.players.find((p) => p.team === this.offense && p.role === "TE");
    const rb = this.players.find((p) => p.team === this.offense && p.role === "RB");
    const ols = this.players.filter((p) => p.team === this.offense && p.role === "OL");
    const dls = this.players.filter((p) => p.team !== this.offense && p.role === "DL");
    ols.forEach((ol, i) => { ol.assignment = { type: "block", targetId: dls[i] ? dls[i].id : 0 }; });
    const rt = (arr) => arr.map(([d, y]) => ({ x: this.los + this.dir * d, y }));
    if (off === "dive" || off === "sweep") {
      wrs.forEach((w) => { w.assignment = { type: "stalk" }; });
      if (te) te.assignment = { type: "stalk" };
      if (rb) rb.assignment = { type: "lane", y: off === "sweep" ? 5 : 15 };
      return;
    }
    if (off === "slant") {
      if (wrs[0]) wrs[0].assignment = { type: "route", points: rt([[2, 4], [7, 10], [14, 13]]), i: 0 };
      if (wrs[1]) wrs[1].assignment = { type: "route", points: rt([[2, 26], [7, 20], [13, 17]]), i: 0 };
      if (te) te.assignment = { type: "route", points: rt([[5, 18], [11, 15]]), i: 0 };
    } else if (off === "screen") {
      if (rb) rb.assignment = { type: "route", points: rt([[-1, 15], [-2, 6], [5, 5.5]]), i: 0 };
      if (wrs[0]) wrs[0].assignment = { type: "route", points: rt([[12, 3.5], [20, 6]]), i: 0 };
      if (wrs[1]) wrs[1].assignment = { type: "route", points: rt([[8, 26], [14, 22]]), i: 0 };
      if (te) te.assignment = { type: "block", targetId: dls[0] ? dls[0].id : 0 };
    } else if (off === "post") {
      if (wrs[0]) wrs[0].assignment = { type: "route", points: rt([[8, 4], [14, 11], [22, 15]]), i: 0 };
      if (wrs[1]) wrs[1].assignment = { type: "route", points: rt([[9, 26], [16, 22], [22, 18]]), i: 0 };
      if (te) te.assignment = { type: "route", points: rt([[6, 19], [14, 16]]), i: 0 };
    } else {
      if (wrs[0]) wrs[0].assignment = { type: "route", points: rt([[10, 3.2], [22, 4], [34, 6]]), i: 0 };
      if (wrs[1]) wrs[1].assignment = { type: "route", points: rt([[8, 27], [18, 24], [28, 20]]), i: 0 };
      if (te) te.assignment = { type: "route", points: rt([[7, 18], [14, 16]]), i: 0 };
    }
    if (rb && off !== "screen") rb.assignment = { type: "block", targetId: 0 };
  }

  collectTargets(off) {
    const wr = this.players.filter((p) => p.team === this.offense && p.role === "WR");
    const te = this.players.find((p) => p.team === this.offense && p.role === "TE");
    const rb = this.players.find((p) => p.team === this.offense && p.role === "RB");
    if (off === "screen") return [rb, te, wr[1]].filter(Boolean);
    if (off === "post") return [wr[0], te, wr[1]].filter(Boolean);
    if (off === "bomb") return [wr[0], wr[1], te].filter(Boolean);
    return [wr[0], wr[1], te, rb].filter(Boolean);
  }

  spawnCoverage(team, fromX, dir) {
    for (let i = 0; i < 5; i++) {
      this.make(team, "GUN", fromX + dir * (2 + i * 0.4), 3 + i * 5.6, 30 + i, "GUN");
    }
  }

  spawnReturn(team, landX) {
    const back = team === "player" ? 8 : -8;
    const g = this.guy(team, "RB");
    this.make(team, "RET", landX, 15, g.num, g.name);
    this.make(team, "WR", landX + back, 8, 15, "UP");
    this.make(team, "WR", landX + back, 22, 16, "DOWN");
  }

  giveBall(p) {
    for (const o of this.players) o.hasBall = false;
    if (!p) {
      this.ball.carrier = null;
      this.ball.mode = "dead";
      return;
    }
    p.hasBall = true;
    this.ball.mode = "carrier";
    this.ball.carrier = p;
    this.ball.x = p.x;
    this.ball.y = p.y;
    this.ball.z = 1;
    this.ball.kick = false;
  }

  userActor() {
    if (this.ball.mode === "air" && this.ball.target && this.ball.target.team === "player") return this.ball.target;
    if (this.ball.carrier && this.ball.carrier.team === "player") return this.ball.carrier;
    if (this.ball.mode === "loose") return this.nearestOn("player", this.ball);
    return this.players.find((p) => p.id === this.controlledId && p.team === "player")
      || this.nearestOn("player", this.ball.carrier || this.ball);
  }

  nearestOn(team, spot) {
    let best = null;
    let bd = 1e9;
    for (const p of this.players) {
      if (p.team !== team || p.role === "OL") continue;
      const d = this.dist(p, spot || p);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  nearestEnemy(p) {
    let best = null;
    let bd = 1e9;
    for (const o of this.players) {
      if (o.team === p.team) continue;
      const d = this.dist(o, p);
      if (d < bd) { bd = d; best = o; }
    }
    return best;
  }

  nearestEnemyDist(p) {
    const e = this.nearestEnemy(p);
    return e ? this.dist(e, p) : 99;
  }

  nearestPlayer(spot) {
    let best = null;
    let bd = 1e9;
    for (const p of this.players) {
      const d = this.dist(p, spot);
      if (d < bd) { bd = d; best = p; }
    }
    return best;
  }

  byId(id) { return this.players.find((p) => p.id === id); }

  tickLive(dt, input) {
    if (this.phase !== "live") return;
    this.playTime += dt;
    this.decay(dt);
    this.desireAI();
    this.applyInput(input);
    if (!this.integrate(dt)) return;
    if (!this.updateBall(dt)) return;
    if (!this.specialEvents()) return;
    if (!this.contact()) return;
    this.tickGameClock(dt);
    if (this.playTime > 12) {
      if (this.ball.carrier) this.deadBall(this.ball.carrier.x, this.ball.carrier.y, { forced: true });
      else if (this.ball.mode === "air") this.incomplete("drop");
      else this.deadBall(this.los, 15, { forced: true });
    }
  }

  decay(dt) {
    for (const p of this.players) {
      p.dive = Math.max(0, p.dive - dt);
      p.juke = Math.max(0, p.juke - dt);
      p.stiff = Math.max(0, p.stiff - dt);
      p.stun = Math.max(0, p.stun - dt);
      p.blocked = Math.max(0, p.blocked - dt);
    }
  }

  desire(p, tx, ty, speed) {
    const dx = tx - p.x;
    const dy = ty - p.y;
    const d = Math.hypot(dx, dy) || 0.0001;
    const s = speed * (p.blocked > 0 ? 0.42 : 1) * (p.stun > 0 ? 0.35 : 1);
    p.vx = (dx / d) * s;
    p.vy = (dy / d) * s;
    p.facing = dx >= 0 ? 1 : -1;
    return d;
  }

  desireAI() {
    const ball = this.ball;
    const carrier = ball.carrier;
    for (const p of this.players) {
      if (p.stun > 0.25 && !p.hasBall) { p.vx *= 0.6; p.vy *= 0.6; continue; }
      if (ball.mode === "loose") {
        this.desire(p, ball.x, ball.y, p.speed * 1.05);
        continue;
      }
      if (ball.mode === "air" && ball.kick) {
        if (p.role === "RET") this.desire(p, ball.toX, ball.toY, p.speed);
        else if (p.role === "GUN") this.desire(p, ball.toX, p.y, p.speed * 0.92);
        else this.desire(p, ball.toX, p.y, p.speed * 0.8);
        continue;
      }
      if (ball.mode === "air" && !ball.kick) {
        const tx = ball.toX;
        const ty = ball.toY;
        if (p === ball.target) {
          const remain = Math.max(0.08, (1 - ball.u) * ball.flight);
          const need = this.dist(p, { x: tx, y: ty }) / remain;
          this.desire(p, tx, ty, clamp(need, p.speed, p.speed * 1.5));
        } else if (p.team !== this.play.offense) {
          const deep = p.role === "DB" || p.role === "LB";
          this.desire(p, tx, ty, p.speed * (p.role === "DB" ? 1.0 : deep ? 0.82 : 0.7));
        } else if (p.assignment && p.assignment.type === "route") {
          this.followRoute(p);
        } else {
          p.vx *= 0.9; p.vy *= 0.9;
        }
        continue;
      }
      if (p.hasBall) {
        if (p.team !== "player") this.cpuCarrier(p);
        else this.idleCarrier(p);
        continue;
      }
      this.playAssignment(p, carrier);
    }
  }

  followRoute(p) {
    const a = p.assignment;
    if (!a || !a.points || !a.points.length) return;
    const pt = a.points[Math.min(a.i, a.points.length - 1)];
    const d = this.desire(p, pt.x, pt.y, p.speed);
    if (d < 0.8 && a.i < a.points.length - 1) a.i += 1;
  }

  cpuCarrier(p) {
    const threat = this.nearestEnemy(p);
    let ty = p.y;
    if (threat && this.dist(threat, p) < 6.5) ty = threat.y > p.y ? p.y - 3.2 : p.y + 3.2;
    const ax = p.team === "player" ? 8 : -8;
    let sp = p.speed;
    if (this.nearestEnemyDist(p) > 3.8) sp *= 1.26;
    this.desire(p, p.x + ax, clamp(ty, 2, 28), sp);
    if (threat && this.dist(threat, p) < 2.4 && p.juke <= 0 && this.rand() < 0.08) this.startJuke(p);
  }

  idleCarrier(p) {
    if (p.role === "QB" && this.canThrow(p)) {
      this.desire(p, p.x - this.play.dir * 1.2, p.y, p.speed * 0.35);
      return;
    }
    let sp = p.speed * 0.86;
    if (this.nearestEnemyDist(p) > 3.8) sp *= 1.26;
    const ax = p.team === "player" ? 6 : -6;
    this.desire(p, p.x + ax, p.y, sp);
  }

  playAssignment(p, carrier) {
    const a = p.assignment || { type: "pursue" };
    const ballCarrier = carrier;
    const past = ballCarrier && (ballCarrier.x - this.play.los) * this.play.dir > 1.2;
    if (past && p.team !== ballCarrier.team && a.type !== "block") {
      this.chase(p, ballCarrier);
      return;
    }
    if (a.type === "route") { this.followRoute(p); return; }
    if (a.type === "lane") {
      this.desire(p, p.x + this.play.dir * 2, a.y, p.speed);
      return;
    }
    if (a.type === "block" || a.type === "stalk") {
      const tgt = this.byId(a.targetId) || this.nearestEnemy(p);
      if (tgt) {
        const spotX = (tgt.x + (ballCarrier ? ballCarrier.x : p.x)) / 2;
        const spotY = (tgt.y + (ballCarrier ? ballCarrier.y : p.y)) / 2;
        this.desire(p, spotX, spotY, p.speed * 0.9);
        if (this.dist(p, tgt) < 1.4 && p.blockTime < 2.15) {
          tgt.blocked = 0.16;
          p.blockTime += 0.016;
        }
        if (p.blockTime >= 2.15) p.stun = Math.max(p.stun, 0.3);
      }
      return;
    }
    if (a.type === "rush") {
      const qb = this.players.find((q) => q.role === "QB" && q.team === this.play.offense) || ballCarrier;
      if (qb) this.desire(p, qb.x, qb.y, p.speed * this.mods.rush);
      return;
    }
    if (a.type === "man") {
      const wr = this.byId(a.targetId);
      if (wr) {
        const cushion = 2.4 / this.mods.cover;
        this.desire(p, wr.x + this.play.dir * cushion, wr.y, p.speed * (0.86 + this.mods.cover * 0.18));
      }
      return;
    }
    if (a.type === "zone" || a.type === "fit") {
      const spotX = this.play.los + this.play.dir * (a.type === "fit" ? 2.2 : this.mods.deep * 0.75);
      this.desire(p, spotX, a.y || p.y, p.speed * (a.type === "fit" ? this.mods.rush : 0.9));
      if (ballCarrier && this.dist(p, ballCarrier) < 8 && a.type === "fit") this.chase(p, ballCarrier);
      return;
    }
    if (ballCarrier && p.team !== ballCarrier.team) this.chase(p, ballCarrier);
  }

  chase(p, target) {
    const lead = target.team === "player" ? 0.35 : 0.35;
    const tx = target.x + (target.vx || 0) * lead;
    const ty = target.y + (target.vy || 0) * 0.15;
    let sp = p.speed;
    if (p.role === "DB") sp *= 1.02;
    this.desire(p, tx, ty, sp);
  }

  applyInput(input) {
    const actor = this.userActor();
    if (!actor || !input) return;
    const m = Math.hypot(input.ax || 0, input.ay || 0);
    if (m > 0.18 && actor.stun <= 0) {
      let ax = input.ax;
      let ay = input.ay;
      const n = m > 1 ? m : 1;
      ax /= n; ay /= n;
      let sp = actor.speed * (actor.juke > 0 ? 1.18 : 1);
      if (actor.hasBall && this.nearestEnemyDist(actor) > 3.8) sp *= 1.26;
      actor.vx = ax * sp;
      actor.vy = ay * sp;
      actor.facing = ax >= 0 ? 1 : -1;
      actor.userDriven = true;
    } else {
      actor.userDriven = false;
    }
    if (input.bEdge) {
      if (this.canThrow(actor)) this.cycleTarget();
      else if (actor.hasBall || (this.ball.mode === "air" && this.ball.target === actor)) this.startJuke(actor);
      else this.switchClosest();
    }
    if (input.aEdge) this.pressA(actor);
  }

  cycleTarget() {
    if (!this.targets.length) return;
    this.targetIndex = (this.targetIndex + 1) % this.targets.length;
  }

  switchClosest() {
    const spot = this.ball.carrier || this.ball;
    const best = this.nearestOn("player", spot);
    if (best) this.controlledId = best.id;
  }

  canThrow(actor) {
    if (!actor || !actor.hasBall || actor.role !== "QB") return false;
    if (!this.play || this.play.kind !== "pass" || this.play.thrown) return false;
    if ((actor.x - this.play.los) * this.play.dir > 1.1) return false;
    return true;
  }

  pressA(actor) {
    if (this.canThrow(actor)) { this.throwBall(actor); return; }
    if (actor.hasBall) { actor.stiff = 0.34; return; }
    this.startDive(actor);
  }

  startDive(p) {
    if (p.dive > 0) return;
    p.dive = 0.3;
    const m = Math.hypot(p.vx, p.vy);
    if (m < 0.4) {
      p.vx = p.facing * p.speed;
      p.vy = 0;
    } else {
      p.vx = (p.vx / m) * p.speed * 1.35;
      p.vy = (p.vy / m) * p.speed * 1.35;
    }
  }

  startJuke(p) {
    if (p.juke > 0) return;
    p.juke = 0.26;
    const m = Math.hypot(p.vx, p.vy);
    if (m < 0.3) {
      p.vy = p.y > 15 ? -p.speed : p.speed;
      p.vx = (p.team === "player" ? 1 : -1) * p.speed * 0.4;
    } else {
      p.vx = (p.vx / m) * p.speed * 1.22;
      p.vy = (p.vy / m) * p.speed * 1.22;
    }
  }

  throwBall(qb) {
    const target = this.targets[this.targetIndex] || this.targets[0];
    if (!target) { this.incomplete("drop"); return; }
    const want = this.play.off === "bomb" ? 26 : this.play.off === "post" ? 13 : this.play.off === "screen" ? 5 : 8;
    let y = target.y;
    if (this.play.off === "post") y = clamp(target.y + (15 - target.y) * 0.55, 3, 27);
    if (this.play.off === "slant") y = clamp(target.y + (15 - target.y) * 0.45, 3, 27);
    const aim = { x: target.x + this.play.dir * want, y };
    const press = this.nearestEnemyDist(qb);
    const err = (press < 2.35 ? 2.6 : 0.45) * (0.3 + this.rand());
    aim.x += (this.rand() - 0.5) * err * 2;
    aim.y = clamp(aim.y + (this.rand() - 0.5) * err * 1.4, 1.5, 28.5);
    const dist = Math.hypot(aim.x - qb.x, aim.y - qb.y);
    const flight = clamp(Math.max(dist / 30, want / (target.speed + 0.1)), 0.48, 2.45);
    qb.hasBall = false;
    this.ball.mode = "air";
    this.ball.carrier = null;
    this.ball.kick = false;
    this.ball.fromX = qb.x;
    this.ball.fromY = qb.y;
    this.ball.toX = aim.x;
    this.ball.toY = aim.y;
    this.ball.u = 0;
    this.ball.flight = flight;
    this.ball.target = target;
    this.ball.airDist = dist;
    this.ball.z = 2;
    this.play.thrown = true;
    this.play.airDist = dist;
    target.assignment = { type: "route", points: [aim], i: 0 };
    this.sfx("throw");
    this.mark("throw");
  }

  integrate(dt) {
    for (const p of this.players) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        p.x = this.los; p.y = 15;
      }
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 16) { p.vx *= 16 / sp; p.vy *= 16 / sp; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.hasBall && this.phase === "live") {
        if (this.crossedGoal(p)) {
          this.onCrossGoal(p);
          return false;
        }
        if (p.y <= 0 || p.y >= 30) {
          this.onSideline(p);
          return false;
        }
      }
      p.x = clamp(p.x, -14, 114);
      p.y = clamp(p.y, 0, 30);
    }
    return this.phase === "live";
  }

  crossedGoal(p) {
    if (p.team === "player") return p.x >= 100;
    return p.x <= 0;
  }

  inOwnEndzone(p) {
    if (p.team === "player") return p.x <= 0;
    return p.x >= 100;
  }

  onSideline(p) {
    if (this.play.kind === "kickoff" && this.inOwnEndzone(p)) {
      this.touchbackSpot(p.team);
      return;
    }
    if (this.inOwnEndzone(p) && this.play.kind !== "kickoff") {
      this.doSafety(other(p.team));
      return;
    }
    this.deadBall(clamp(p.x, 1, 99), clamp(p.y, 1, 29), { oob: true });
  }

  onCrossGoal(p) {
    if (this.play.twoPt) { this.endTwo(true, p.team); return; }
    this.doTD(p);
  }

  updateBall(dt) {
    const ball = this.ball;
    if (ball.mode === "carrier" && ball.carrier) {
      ball.x = ball.carrier.x;
      ball.y = ball.carrier.y;
      ball.z = ball.carrier.dive > 0 ? 0.3 : 1.15;
      return true;
    }
    if (ball.mode === "loose") {
      ball.x += (ball.vx || 0) * dt;
      ball.y += (ball.vy || 0) * dt;
      ball.vx = (ball.vx || 0) * 0.9;
      ball.vy = (ball.vy || 0) * 0.9;
      ball.y = clamp(ball.y, 1, 29);
      ball.x = clamp(ball.x, -2, 102);
      ball.looseT = (ball.looseT || 0) + dt;
      let grab = null;
      for (const p of this.players) {
        if (this.dist(p, ball) < 1.2) { grab = p; break; }
      }
      if (!grab && ball.looseT > 1.5) grab = this.nearestPlayer(ball);
      if (grab) {
        this.giveBall(grab);
        this.sfx("catch");
        if (grab.team !== this.play.fumbleBy) this.play.turnoverLive = true;
      }
      return this.phase === "live";
    }
    if (ball.mode === "air") {
      ball.u += dt / ball.flight;
      const u = clamp(ball.u, 0, 1);
      ball.x = ball.fromX + (ball.toX - ball.fromX) * u;
      ball.y = ball.fromY + (ball.toY - ball.fromY) * u;
      ball.z = Math.sin(u * Math.PI) * (3.2 + Math.min(8, ball.airDist * 0.12));
      if (u >= 1) return this.arriveBall();
    }
    return true;
  }

  arriveBall() {
    const ball = this.ball;
    if (ball.kick) {
      if (ball.touchback || (ball.toX <= 1) || (ball.toX >= 99 && ball.punt)) {
        const recv = other(this.play.offense);
        if (ball.touchback || ball.toX <= 0 || ball.toX >= 100) {
          this.touchbackSpot(recv);
          return false;
        }
      }
      const ret = this.players.find((p) => p.role === "RET");
      if (ret) {
        ret.x = ball.toX;
        ret.y = clamp(ball.toY, 2, 28);
        this.giveBall(ret);
        this.play.caught = true;
        this.clockRunning = true;
        this.sfx("catch");
        if (ret.team === "player") this.controlledId = ret.id;
      }
      return this.phase === "live";
    }
    return this.resolveCatch();
  }

  resolveCatch() {
    const ball = this.ball;
    const land = { x: ball.toX, y: ball.toY };
    const offense = this.play.offense;
    let catcher = null;
    let cd = 99;
    for (const p of this.players) {
      if (p.team !== offense) continue;
      if (!["WR", "TE", "RB", "QB"].includes(p.role)) continue;
      const d = this.dist(p, land);
      const bonus = (p === ball.target && p.dive > 0) ? -1.3 : 0;
      if (d + bonus < cd) { cd = d + bonus; catcher = p; }
    }
    let def = null;
    let dd = 99;
    for (const p of this.players) {
      if (p.team === offense) continue;
      const d = this.dist(p, land);
      if (d < dd) { dd = d; def = p; }
    }
    const reached = catcher && cd < 3.8;
    if (def && dd < 1.45 && dd + 0.15 < cd) {
      this.intercept(def, land);
      return this.phase === "live";
    }
    if (!reached) {
      if (def && dd < 1.35 && this.rand() < 0.55) this.intercept(def, land);
      else this.incomplete("drop");
      return false;
    }
    const sep = def ? dd : 99;
    if (sep > 2.15) { this.complete(catcher, land); return this.phase === "live"; }
    const r = this.rand();
    if (r < 0.72) { this.complete(catcher, land); return this.phase === "live"; }
    if (def && r < 0.86 && dd < 1.7) { this.intercept(def, land); return this.phase === "live"; }
    this.incomplete("drop");
    return false;
  }

  complete(catcher, land) {
    catcher.x = catcher.x * 0.35 + land.x * 0.65;
    catcher.y = clamp(catcher.y * 0.35 + land.y * 0.65, 1.5, 28.5);
    this.giveBall(catcher);
    this.play.caught = true;
    if (catcher.team === "player") this.controlledId = catcher.id;
    this.sfx("catch");
    this.mark("catch");
    if ((this.play.airDist || 0) >= 20) {
      this.play.bomb = true;
      this.slow = 0.7;
    }
    if (this.crossedGoal(catcher)) this.onCrossGoal(catcher);
  }

  intercept(def, land) {
    def.x = land.x;
    def.y = clamp(land.y, 1.5, 28.5);
    this.giveBall(def);
    this.play.picked = true;
    this.play.turnoverLive = true;
    this.stats[this.play.offense].ints += 1;
    if (def.team === "player") this.controlledId = def.id;
    this.sfx("pick");
    this.slow = 0.45;
    this.mark("int");
    if (this.crossedGoal(def)) this.onCrossGoal(def);
  }

  specialEvents() {
    if (this.phase !== "live" || !this.play) return false;
    if (this.play.kind === "run" && !this.play.handed && this.playTime > 0.2) {
      const qb = this.players.find((p) => p.role === "QB" && p.team === this.play.offense);
      const rb = this.players.find((p) => p.role === "RB" && p.team === this.play.offense);
      if (qb && qb.hasBall && rb && this.dist(qb, rb) < 5.5) this.giveBall(rb);
      this.play.handed = true;
      if (rb && rb.hasBall && rb.team === "player") this.controlledId = rb.id;
    }
    if (this.play.kind === "pass" && !this.play.thrown && this.play.offense === "cpu") {
      const qb = this.players.find((p) => p.role === "QB" && p.hasBall);
      if (qb) {
        const press = this.nearestEnemyDist(qb);
        const open = this.bestOpen();
        if (press < 2.15 || this.playTime > 2.15 || (open > 2.8 && this.playTime > 0.85)) {
          this.targetIndex = this.bestTargetIndex();
          this.throwBall(qb);
        }
      }
    }
    return this.phase === "live";
  }

  bestOpen() {
    let best = 0;
    for (const t of this.targets) {
      const d = this.nearestEnemyDist(t);
      if (d > best) best = d;
    }
    return best;
  }

  bestTargetIndex() {
    let bi = 0;
    let bs = -1;
    this.targets.forEach((t, i) => {
      const s = this.nearestEnemyDist(t) + (this.play.off === "bomb" && i === 0 ? 1.5 : 0);
      if (s > bs) { bs = s; bi = i; }
    });
    return bi;
  }

  contact() {
    if (this.phase !== "live") return false;
    const carrier = this.ball.carrier;
    if (!carrier || this.ball.mode !== "carrier") return true;
    if (this.play.kind === "kickoff" && !this.play.caught) return true;
    if ((this.play.kind === "punt") && !this.play.caught && this.ball.mode !== "carrier") return true;
    for (const d of this.players) {
      if (d.team === carrier.team || d.stun > 0) continue;
      if (d.blocked > 0 && d.dive <= 0) continue;
      const dist = this.dist(d, carrier);
      const reach = d.dive > 0 ? 1.8 : 0.96;
      if (dist > reach) continue;
      if (carrier.juke > 0 && d.dive <= 0) { d.stun = 0.28; continue; }
      if (carrier.stiff > 0 && d.dive <= 0) { d.stun = 0.5; carrier.stiff = 0; continue; }
      this.tackle(d, carrier);
      return this.phase === "live";
    }
    return true;
  }

  tackle(def, carrier) {
    if (this.phase !== "live") return;
    const rel = def ? Math.hypot((def.vx || 0) - carrier.vx, (def.vy || 0) - carrier.vy) : 0;
    const crunch = !!(def && (rel > 10.5 || (def.dive > 0 && rel > 5.5)));
    if (crunch) {
      this.shake = 8;
      this.sfx("crunch");
      this.banner = { main: "CRUNCH", sub: def.name || "", t: 0.75 };
      this.mark("crunch");
      if (!this.play.twoPt && this.play.kind !== "kickoff" && this.rand() < (def.dive > 0 ? 0.16 : 0.12)) {
        this.startFumble(carrier);
        return;
      }
    }
    if (this.play.kind === "kickoff" && this.inOwnEndzone(carrier)) {
      this.touchbackSpot(carrier.team);
      return;
    }
    if (this.inOwnEndzone(carrier) && this.play.kind !== "kickoff") {
      this.doSafety(other(carrier.team));
      return;
    }
    const sack = carrier.role === "QB" && this.play.kind === "pass" && !this.play.thrown && !this.play.handed;
    this.deadBall(carrier.x, carrier.y, { crunch, sack, oob: false });
  }

  startFumble(carrier) {
    carrier.hasBall = false;
    this.ball.mode = "loose";
    this.ball.carrier = null;
    this.ball.x = carrier.x;
    this.ball.y = carrier.y;
    this.ball.z = 0.4;
    this.ball.vx = (this.rand() - 0.5) * 12;
    this.ball.vy = (this.rand() - 0.5) * 8;
    this.ball.looseT = 0;
    this.play.fumbleBy = carrier.team;
    this.sfx("fumble");
    this.mark("fumble");
  }

  touchbackSpot(recv) {
    if (this.phase !== "live") return;
    this.offense = recv;
    this.los = recv === "player" ? 25 : 75;
    this.dir = recv === "player" ? 1 : -1;
    this.down = 1;
    this.toGo = 10;
    this.chains = this.los + this.dir * 10;
    this.clockRunning = false;
    this.startDrive();
    this.mark("touchback");
    this.finish(this.periodGate("playcall"), null, { bucket: "kickoff" });
  }

  doSafety(scoring) {
    if (this.phase !== "live") return;
    this.scores[scoring] += 2;
    this.mark("safety");
    this.sfx("td");
    this.shake = 5;
    const victim = other(scoring);
    this.safetyKick = true;
    this.kickReceiver = scoring;
    this.offense = victim;
    if (this.ot || this.play.twoPt) {
      if (this.play.twoPt) { this.twoPt = false; }
      this.finish("final", { main: "SAFETY", sub: "" }, {
        bucket: scoring === "player" ? "safety" : "safety_against",
        celebrate: scoring === "player",
        negative: scoring !== "player",
      });
      return;
    }
    this.finish(this.periodGate("kickoff"), { main: "SAFETY", sub: "" }, {
      bucket: scoring === "player" ? "safety" : "safety_against",
      celebrate: scoring === "player",
      negative: scoring !== "player",
    });
  }

  doTD(p) {
    if (this.phase !== "live") return;
    const team = p.team;
    const margin = this.scores.player - this.scores.cpu;
    this.scores[team] += 6;
    this.stats[team].tds += 1;
    this.sfx("td");
    this.shake = 6;
    this.mark("td");
    const air = this.play.airDist || 0;
    const hail = !!(this.play.thrown && (this.quarter >= 4 || this.ot) && (this.clockAtSnap <= 22 || this.expired) && (air >= 18 || this.play.off === "bomb"));
    const pick = !!(this.play.picked && team !== this.play.offense);
    const bomb = !!(this.play.thrown && (this.play.bomb || air >= 20) && !pick && !hail);
    if (hail) this.sfx("hail");
    if (pick) this.sfx("pick");
    const banner = bigMoment({ td: true, hail, pick, bomb });
    if (banner && banner.main === "TOUCHDOWN" && p.name) banner.sub = String(p.name).toUpperCase();
    let bucket = "td";
    if (pick) bucket = "pick_six";
    else if (hail) bucket = "hail";
    else if (bomb) bucket = "bomb";
    else if (team !== "player") bucket = "cpu_td";
    const comeback = team === "player" && margin <= -10;
    const gain = Math.abs((p.x || 0) - (this.play.los || 0));
    if (!this.play.thrown && gain >= 18 && team === "player" && bucket === "td") bucket = "big_run";
    this.stats[team][this.play.thrown ? "pass" : "rush"] += this.play.thrown ? Math.max(10, air) : Math.max(1, gain);
    const cue = {
      bucket,
      celebrate: team === "player",
      negative: team !== "player",
      blown: team !== "player" && (bomb || air >= 20),
      comeback,
    };
    if (this.ot) {
      this.finish("final", banner, cue);
      return;
    }
    this.patFor = team;
    this.kickReceiver = other(team);
    this.twoPt = false;
    this.finish("pat", banner, cue);
  }

  endTwo(success, team) {
    if (this.phase !== "live" && this.phase !== "fg") return;
    if (success) {
      this.scores[team] += 2;
      this.sfx("td");
      this.mark("two");
    } else this.mark("two-fail");
    this.twoPt = false;
    const playerAttempt = this.patFor === "player";
    const banner = success ? { main: "TWO POINTS", sub: "" } : { main: "NO GOOD", sub: "" };
    this.finish(this.periodGate("kickoff"), banner, {
      bucket: success ? "two_pt" : "two_pt_fail",
      celebrate: success && (team === "player"),
      negative: (!success && playerAttempt) || (success && team !== "player" && playerAttempt),
    });
  }

  incomplete(why) {
    if (this.phase !== "live") return;
    if (this.play.twoPt) { this.endTwo(false, this.play.offense); return; }
    if (this.drive) this.drive.plays += 1;
    this.down += 1;
    this.clockRunning = false;
    this.mark(why === "drop" ? "drop" : "incomplete");
    const playerOff = this.play.offense === "player";
    if (this.down > 4) {
      const three = this.threeAndOut();
      this.flipPossession(this.play.los);
      this.finish(this.periodGate("playcall"), null, three
        ? { bucket: "three_and_out", negative: true }
        : { bucket: "turnover_downs", negative: playerOff, celebrate: !playerOff });
      return;
    }
    this.finish(this.periodGate("playcall"), null, why === "drop" && playerOff ? { bucket: "drop", negative: true } : null);
  }

  deadBall(x, y, flags = {}) {
    if (this.phase !== "live") return;
    const carrier = this.ball.carrier;
    if (this.play.twoPt) { this.endTwo(false, carrier ? carrier.team : this.play.offense); return; }
    const switched = !!(carrier && carrier.team !== this.play.offense);
    if (switched || (this.play.turnoverLive && carrier)) {
      const posTeam = carrier.team;
      const playerLost = this.play.offense === "player" && posTeam !== "player";
      this.offense = posTeam;
      this.los = clamp(x, 1, 99);
      this.dir = posTeam === "player" ? 1 : -1;
      this.down = 1;
      this.toGo = Math.min(10, this.distToGoal());
      this.chains = this.los + this.dir * this.toGo;
      this.clockRunning = !flags.oob;
      this.startDrive();
      let cue = { bucket: "kickoff" };
      if (this.play.picked) cue = { bucket: playerLost ? "int" : "int_win", negative: playerLost, celebrate: !playerLost };
      else if (this.play.fumbleBy) cue = { bucket: this.play.fumbleBy === "player" ? "fumble" : "fumble_win", negative: this.play.fumbleBy === "player", celebrate: this.play.fumbleBy !== "player" };
      else if (this.play.three && playerLost) cue = { bucket: "three_and_out", negative: true };
      const banner = flags.crunch ? { main: "CRUNCH", sub: "" } : null;
      this.mark("dead-switch");
      this.finish(this.periodGate("playcall"), banner, cue);
      return;
    }
    const endX = clamp(x, 1, 99);
    const gain = (endX - this.play.los) * this.play.dir;
    if (this.play.thrown) this.stats[this.play.offense].pass += gain;
    else this.stats[this.play.offense].rush += gain;
    if (this.drive && this.drive.offense === this.play.offense) {
      this.drive.plays += 1;
      this.drive.gain += gain;
    }
    if (flags.sack) {
      this.stats[this.play.offense].sacks += 1;
      this.mark("sack");
    }
    this.los = endX;
    this.clockRunning = !flags.oob;
    const made = (endX - this.play.chains) * this.play.dir >= -0.15;
    let banner = flags.crunch ? { main: "CRUNCH", sub: "" } : null;
    let cue = null;
    if (flags.sack) {
      cue = {
        bucket: this.play.offense === "player" ? "sack" : "sack_win",
        negative: this.play.offense === "player",
        celebrate: this.play.offense !== "player",
      };
    } else if (!this.play.thrown && gain >= 16) {
      cue = { bucket: "big_run", celebrate: this.play.offense === "player", negative: false };
    }
    if (made) {
      this.down = 1;
      this.toGo = Math.min(10, this.distToGoal());
      this.chains = this.los + this.dir * this.toGo;
      if (this.drive) this.drive.firstDowns += 1;
      this.threeStreak = 0;
      if (!banner) banner = { main: "FIRST DOWN", sub: "" };
      this.mark("first");
    } else {
      this.down += 1;
      this.toGo = Math.max(0.5, Math.abs(this.chains - this.los));
      if (this.down > 4) {
        const playerOff = this.play.offense === "player";
        const three = this.threeAndOut();
        this.flipPossession(this.los);
        this.mark("downs");
        this.finish(this.periodGate("playcall"), banner, three
          ? { bucket: "three_and_out", negative: true }
          : { bucket: "turnover_downs", negative: playerOff, celebrate: !playerOff });
        return;
      }
    }
    if (this.pendingTwoMin) {
      this.pendingTwoMin = false;
      this.twoMin = true;
      this.clockRunning = false;
    }
    this.mark("tackle");
    this.finish(this.periodGate("playcall"), banner, cue);
  }

  tickGameClock(dt) {
    if (!this.clockRunning || this.twoPt) return;
    this.clock -= dt * 8;
    if ((this.quarter === 2 || this.quarter === 4) && !this.twoMin && this.clock <= 120 && this.clock > 0) {
      this.pendingTwoMin = true;
    }
    if (this.clock <= 0) {
      this.clock = 0;
      this.expired = true;
    }
  }

  finish(next, banner, cue) {
    if (this.phase !== "live" && this.phase !== "fg") return;
    if (banner) this.banner = { main: banner.main, sub: banner.sub || "", t: 1.55 };
    if (cue) this.cue = cue;
    this.players = [];
    this.ball.mode = "dead";
    this.ball.carrier = null;
    this.targets = [];
    if (this.pendingTwoMin) {
      this.twoMin = true;
      this.pendingTwoMin = false;
      this.clockRunning = false;
    }
    if (next === "final") {
      this.phase = "final";
      this.nextStep = null;
      this.mark("final");
      return;
    }
    this.phase = "celebrate";
    this.phaseT = banner ? 1.45 : 0.8;
    this.nextStep = next;
  }

  botInput() {
    const blank = blankInput();
    const actor = this.userActor();
    if (!actor) return blank;
    const ball = this.ball;
    if (ball.mode === "air" && ball.target === actor && !ball.kick) {
      const dx = ball.toX - actor.x;
      const dy = ball.toY - actor.y;
      const m = Math.hypot(dx, dy) || 1;
      return { ax: dx / m, ay: dy / m, aEdge: m < 2.2 && ball.u > 0.72, bEdge: false, aDown: false, bDown: false };
    }
    if (actor.hasBall && this.canThrow(actor)) {
      const press = this.nearestEnemyDist(actor);
      if (this.playTime > 1.05 || press < 2.45) return { ...blank, aEdge: true, aDown: true };
      return { ...blank, ax: -this.play.dir * 0.25 };
    }
    if (actor.hasBall) {
      const threat = this.nearestEnemy(actor);
      let ay = 0;
      let bEdge = false;
      if (threat) {
        const d = this.dist(threat, actor);
        const forward = (threat.x - actor.x) * (actor.team === "player" ? 1 : -1) > -1;
        if (d < 5.5 && forward) ay = threat.y > actor.y ? -1 : 1;
        if (d < 2.2 && this.rand() < 0.12) bEdge = true;
      }
      return { ax: actor.team === "player" ? 1 : -1, ay, aEdge: false, bEdge, aDown: false, bDown: false };
    }
    const target = ball.carrier || ball;
    const dx = (target.x || 0) - actor.x;
    const dy = (target.y || 15) - actor.y;
    const m = Math.hypot(dx, dy) || 1;
    return { ax: dx / m, ay: dy / m, aEdge: m < 2.15 && this.rand() < 0.18, bEdge: false, aDown: false, bDown: false };
  }

  snapshot() {
    const target = this.targets[this.targetIndex];
    return {
      phase: this.phase,
      flip: this.visualFlip(),
      players: this.players.map((p) => ({
        x: p.x, y: p.y, team: p.team, role: p.role, num: p.num, name: p.name,
        facing: p.facing, dive: p.dive > 0, juke: p.juke > 0,
        hasBall: p.hasBall,
        controlled: p === this.userActor(),
        target: !!target && p === target && this.play && this.play.kind === "pass" && !this.play.thrown,
        primary: p.primary, secondary: p.secondary, pants: p.pants,
      })),
      ball: {
        x: this.ball.x, y: this.ball.y, z: this.ball.z || 0, mode: this.ball.mode,
      },
      los: this.los,
      chains: this.chains,
      shake: this.shake,
      banner: this.banner && this.banner.t > 0 ? this.banner : null,
      note: this.noteT > 0 ? this.note : "",
      quarter: this.ot ? "OT" : `Q${this.quarter}`,
      clock: fmtClock(this.clock),
      clockRaw: this.clock,
      down: this.downText(),
      spot: this.spotText(),
      scores: { ...this.scores },
      timeouts: { ...this.timeouts },
      offense: this.offense,
      player: { abbr: this.player.abbr, color: this.player.primary, name: this.player.short },
      cpu: { abbr: this.cpu.abbr, color: this.cpu.primary, name: this.cpu.short },
      playClock: Math.max(0, Math.ceil(this.playClock || 0)),
      fg: this.phase === "fg" ? { ...this.fg } : null,
      twoPt: this.twoPt,
      cpuPlan: this.cpuPlan,
      throwTo: target ? `${target.num} ${target.name}` : "",
      canThrow: this.phase === "live" && this.targets.length > 0 && this.play && this.play.kind === "pass" && !this.play.thrown && this.offense === "player",
      stats: this.stats,
      cue: this.cue,
      fgDist: this.fgDistance(),
      inRange: this.fgDistance() <= 62,
    };
  }
}

function blankInput() {
  return { ax: 0, ay: 0, aEdge: false, bEdge: false, aDown: false, bDown: false };
}
