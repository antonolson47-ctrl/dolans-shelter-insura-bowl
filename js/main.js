import { AudioBus } from "./audio.js";
import { Commentator, bucketForCue } from "./commentary.js";
import { FieldView } from "./render.js";
import { Season } from "./season.js";
import { Game } from "./sim.js";
import {
  DEF_PLAYS, OFF_PLAYS, PLAYABLE, TEAMS, TROPHIES,
  exhibitionOpponents, rivalryBetween, trophyFor,
} from "./teams.js";

const audio = new AudioBus();
const commentator = new Commentator();
const $ = (id) => document.getElementById(id);

const hold = { a: false, b: false, up: false, down: false, left: false, right: false };
let stick = { ax: 0, ay: 0, active: false };
let aEdge = false;
let bEdge = false;
let confirmEdge = false;

let mode = "exhibition";
let season = null;
let userTeam = null;
let cpuTeam = null;
let receive = true;
let game = null;
let field = null;
let last = 0;
let paused = false;
let selectedPlay = null;
let builtPhase = "";
let bubbleUntil = 0;
let finalHandled = false;
let pendingTrophy = null;
let afterTrophy = "hub";

const BIG = new Set(["BOMB", "CRUNCH", "TOUCHDOWN", "PICK-SIX", "HAIL CLAIM", "SAFETY", "FIELD GOAL", "TWO POINTS", "OVERTIME"]);

function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("on", s.id === id));
  if (id === "title" || id === "mode" || id === "team" || id === "how") audio.startMusic("title");
}

function unlock() { audio.unlock(); }

function setMute(m) {
  audio.setMuted(m);
  try { localStorage.setItem("insura-mute", m ? "1" : "0"); } catch { /* ignore */ }
  $("muteTitle").textContent = m ? "SOUND OFF" : "SOUND ON";
}

function teamCard(team) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "team-card";
  const mark = { cyclodes: "CY", giants: "NY", gilbert: "G" }[team.id] || team.abbr.slice(0, 2);
  const sw = team.mascot === "tiger"
    ? `<img src="art/gilbert-tigers-logo.jpg" alt="">`
    : `<div class="swatch" style="background:${team.primary};color:${team.secondary}">${mark}</div>`;
  btn.innerHTML = `${sw}<div><div class="city">${team.city}</div><div class="name">${team.short}</div><small>HELMET #${team.helmetNo} · OVR ${team.rating}</small></div>`;
  btn.addEventListener("click", () => chooseTeam(team.id));
  return btn;
}

function fillTeams() {
  const list = $("teamList");
  list.replaceChildren();
  for (const id of PLAYABLE) list.append(teamCard(TEAMS[id]));
}

function chooseTeam(id) {
  unlock();
  userTeam = TEAMS[id];
  if (mode === "season") {
    Season.clear();
    season = new Season(id);
    season.save();
    renderHub();
    show("hub");
    return;
  }
  renderOpponents();
  show("opp");
}

function renderOpponents() {
  const list = $("oppList");
  list.replaceChildren();
  const opps = exhibitionOpponents(userTeam.id).sort((a, b) => {
    const ra = rivalryBetween(userTeam.id, a.id) ? 0 : 1;
    const rb = rivalryBetween(userTeam.id, b.id) ? 0 : 1;
    return ra - rb || b.rating - a.rating;
  });
  for (const opp of opps) {
    const riv = rivalryBetween(userTeam.id, opp.id);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "opp";
    btn.innerHTML = `<div><b style="color:${opp.primary}">${opp.name}</b><span>${riv ? " RIVALRY" : ""} · OVR ${opp.rating}</span></div><span class="tag">${riv ? riv.toUpperCase() : "EXHIBITION"}</span>`;
    btn.addEventListener("click", () => {
      cpuTeam = opp;
      season = null;
      openPregame(riv ? `RIVALRY · ${riv.toUpperCase()}` : "EXHIBITION");
    });
    list.append(btn);
  }
}

function renderHub() {
  const g = season.current;
  $("hubKicker").textContent = season.champion ? "CHAMPIONS" : season.eliminated ? "CLAIM DENIED" : "SEASON";
  $("hubTeam").textContent = season.team.short;
  $("hubRecord").textContent = `RECORD ${season.recordLine()}`;
  const opp = g ? TEAMS[g.opp] : null;
  $("hubNext").textContent = !g || season.over
    ? (season.champion ? "The umbrella is paid in full." : "The season is over. They noticed.")
    : `${g.label} vs ${opp.name}`;
  $("hubPlay").classList.toggle("hidden", season.over || !g);
  $("hubPlay").textContent = g && g.round === "insura" ? "INSURA-BOWL" : "KICKOFF";
  const box = $("hubSchedule");
  box.replaceChildren();
  season.games.forEach((gameDef, i) => {
    const row = document.createElement("div");
    row.className = "week" + (i === season.index && !season.over ? " on" : "");
    const res = season.results[i];
    const name = TEAMS[gameDef.opp].short;
    const mark = res ? (res.win ? "W" : "L") + " " + res.score : (i === season.index && !season.over ? "NEXT" : "");
    row.innerHTML = `<span>${gameDef.label} · ${name}</span><span class="${res ? (res.win ? "win" : "loss") : ""}">${mark}</span>`;
    box.append(row);
  });
  if (season.trophies.length) {
    const row = document.createElement("div");
    row.className = "week";
    row.textContent = "TROPHIES: " + season.trophies.map((id) => TROPHIES[id].name).join(" · ");
    box.append(row);
  }
}

function openPregame(label) {
  receive = true;
  $("preLabel").textContent = label;
  $("preMatch").textContent = `${userTeam.short} vs ${cpuTeam.short}`;
  const riv = rivalryBetween(userTeam.id, cpuTeam.id);
  $("preNote").textContent = riv
    ? "Win it and you lift hardware. Lose it and they will not let you forget."
    : "Clear skies. Umbrella optional. Big plays mandatory.";
  paintReceive();
  show("pregame");
}

function paintReceive() {
  $("recvBtn").classList.toggle("alt", !receive);
  $("kickBtn").classList.toggle("alt", receive);
}

function startMatch() {
  unlock();
  commentator.resetGame();
  finalHandled = false;
  pendingTrophy = null;
  paused = false;
  selectedPlay = null;
  builtPhase = "";
  game = new Game({ player: userTeam, cpu: cpuTeam, receive });
  game.start(receive);
  const round = season && season.current && season.current.round;
  audio.startMusic(round ? "playoff" : "game");
  show("game");
  if (!field) field = new FieldView($("field"));
}

function readInput() {
  let ax = (hold.right ? 1 : 0) - (hold.left ? 1 : 0);
  let ay = (hold.down ? 1 : 0) - (hold.up ? 1 : 0);
  if (stick.active) { ax = stick.ax; ay = stick.ay; }
  const m = Math.hypot(ax, ay);
  if (m > 1) { ax /= m; ay /= m; }
  const flip = game ? game.visualFlip() : false;
  if (flip) ax = -ax;
  const input = { ax, ay, aEdge, bEdge, aDown: hold.a, bDown: hold.b };
  aEdge = false;
  bEdge = false;
  return input;
}

function say(line) {
  if (!line) return;
  $("pat").classList.remove("hidden");
  $("kenny").classList.remove("hidden");
  $("pat").querySelector("span").textContent = line.pat;
  $("kenny").querySelector("span").textContent = line.kenny;
  bubbleUntil = performance.now() + 7000;
}

function hideBubbles() {
  $("pat").classList.add("hidden");
  $("kenny").classList.add("hidden");
}

function ink(hex) {
  const n = parseInt(String(hex).slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? "#1a1202" : "#fff";
}

function syncHud(snap) {
  $("homeAbbr").textContent = `${snap.offense === "player" ? "▶ " : ""}${snap.player.abbr}`;
  $("awayAbbr").textContent = `${snap.offense === "cpu" ? "▶ " : ""}${snap.cpu.abbr}`;
  $("homeScore").textContent = snap.scores.player;
  $("awayScore").textContent = snap.scores.cpu;
  $("bugHome").style.background = snap.player.color;
  $("bugAway").style.background = snap.cpu.color;
  $("bugHome").style.color = ink(snap.player.color);
  $("bugAway").style.color = ink(snap.cpu.color);
  $("bugClock").textContent = `${snap.quarter} ${snap.clock}`;
  $("bugClock").style.color = snap.clockRaw <= 30 ? "#ff5a5a" : "#f5c518";
  $("bugDown").textContent = snap.phase === "playcall" ? `${snap.down}  ${snap.playClock}` : snap.down;
  $("bugSpot").textContent = snap.canThrow && snap.throwTo ? `TO ${snap.throwTo}` : snap.spot;
  $("possHome").classList.toggle("on", snap.offense === "player" && snap.phase !== "final");
  $("possAway").classList.toggle("on", snap.offense === "cpu" && snap.phase !== "final");
  $("note").textContent = snap.note || "";
  const b = snap.banner;
  $("banner").classList.toggle("hidden", !b);
  $("subbanner").classList.toggle("hidden", !b || !b.sub);
  if (b) {
    $("banner").textContent = b.main;
    $("banner").classList.toggle("big", BIG.has(b.main));
    $("subbanner").textContent = b.sub || "";
  }
  const onOffense = snap.offense === "player";
  const throwing = snap.canThrow;
  $("aLabel").textContent = snap.phase === "fg" ? "KICK" : throwing ? "THROW" : snap.phase === "live" ? "DIVE" : "A";
  $("bLabel").textContent = throwing ? "NEXT" : onOffense ? "JUKE" : "SWITCH";
}

function syncCue(snap) {
  if (snap.cue) {
    const bucket = bucketForCue(snap.cue, snap.scores);
    say(commentator.line(bucket));
    game.cue = null;
  } else if (performance.now() > bubbleUntil) hideBubbles();
}

function playButtons(plays, selected) {
  return plays.map((p) => `<button type="button" class="play${selected === p.id ? " on" : ""}" data-act="play" data-arg="${p.id}"><b>${p.name}</b><span>${p.blurb || ""}</span></button>`).join("");
}

function buildOverlay(snap) {
  const ov = $("overlay");
  if (paused) {
    ov.innerHTML = `<div class="sheet"><div class="sheet-head">PAUSED</div><button class="btn" data-act="resume" type="button">RESUME</button><button class="btn ghost" data-act="quit" type="button">QUIT GAME</button></div>`;
    builtPhase = "paused";
    return;
  }
  if (snap.phase === builtPhase && snap.phase !== "playcall") return;
  if (snap.phase === "playcall") {
    const cpuKick = snap.offense === "cpu" && (snap.cpuPlan === "punt" || snap.cpuPlan === "fg");
    const legal = snap.offense === "player" && !cpuKick
      ? [...OFF_PLAYS.map((p) => p.id), ...(snap.twoPt ? [] : ["punt", ...(snap.inRange ? ["fg"] : [])])]
      : DEF_PLAYS.map((p) => p.id);
    if (!legal.includes(selectedPlay)) selectedPlay = legal[0];
    let body = "";
    if (snap.twoPt) {
      body = `<div class="sheet-head">2-PT TRY</div>${playGrid(snap)}<button class="btn" data-act="hike" type="button">HIKE</button>`;
    } else if (cpuKick) {
      body = `<div class="sheet-head">${snap.cpuPlan === "fg" ? "FIELD GOAL TEAM" : "PUNT TEAM"}</div><button class="btn" data-act="hike" type="button">${snap.cpuPlan === "fg" ? "BLOCK WATCH" : "RETURN"}</button>`;
    } else if (snap.offense === "player") {
      const extra = [];
      extra.push(`<button type="button" class="play${selectedPlay === "punt" ? " on" : ""}" data-act="play" data-arg="punt"><b>PUNT</b><span>Flip the field</span></button>`);
      if (snap.inRange) extra.push(`<button type="button" class="play${selectedPlay === "fg" ? " on" : ""}" data-act="play" data-arg="fg"><b>FG ${snap.fgDist}</b><span>Time the needle</span></button>`);
      body = `<div class="sheet-head"><span>YOUR OFFENSE</span><button class="btn ghost" data-act="timeout" type="button">TIMEOUT ${snap.timeouts.player}</button></div>
        <div class="play-grid">${playButtons(OFF_PLAYS, selectedPlay)}${extra.join("")}</div>
        <button class="btn" data-act="hike" type="button">HIKE</button>`;
    } else {
      body = `<div class="sheet-head"><span>YOUR DEFENSE</span><button class="btn ghost" data-act="timeout" type="button">TIMEOUT ${snap.timeouts.player}</button></div>
        <div class="play-grid">${playButtons(DEF_PLAYS, selectedPlay)}</div>
        <button class="btn" data-act="hike" type="button">HIKE</button>`;
    }
    ov.innerHTML = `<div class="sheet">${body}</div>`;
    builtPhase = "playcall";
    return;
  }
  if (snap.phase === "fg" && snap.fg) {
    const zone = snap.fg.pat ? 34 : Math.max(12, 28 - Math.max(0, snap.fg.dist - 30) * 0.4);
    ov.innerHTML = `<div class="sheet"><div class="sheet-head">${snap.fg.pat ? "EXTRA POINT" : "FIELD GOAL " + snap.fg.dist}</div>
      <div class="meter"><div class="zone" style="left:${50 - zone / 2}%;width:${zone}%"></div><div class="needle" id="needle"></div></div>
      <button class="btn" data-act="lock" type="button">A — KICK</button></div>`;
    builtPhase = "fg";
    return;
  }
  if (snap.phase === "pat") {
    const us = game.patFor === "player";
    ov.innerHTML = us
      ? `<div class="sheet"><div class="sheet-head">TOUCHDOWN · EXTRA POINT</div><div class="btn-row"><button class="btn" data-act="pat" data-arg="kick" type="button">KICK (1)</button><button class="btn alt" data-act="pat" data-arg="two" type="button">GO FOR 2</button></div></div>`
      : `<div class="sheet"><div class="sheet-head">THEIR EXTRA POINT</div></div>`;
    builtPhase = "pat";
    return;
  }
  if (snap.phase === "celebrate" || snap.phase === "quarter" || snap.phase === "halftime") {
    ov.innerHTML = `<div class="sheet"><button class="btn" data-act="skip" type="button">CONTINUE</button></div>`;
    builtPhase = snap.phase;
    return;
  }
  ov.innerHTML = "";
  builtPhase = snap.phase;
}

function playGrid(snap) {
  return `<div class="play-grid">${playButtons(OFF_PLAYS, selectedPlay)}</div>`;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
  last = now;
  if (game && $("game").classList.contains("on")) {
    if (!paused) {
      const input = readInput();
      if (confirmEdge) {
        confirmEdge = false;
        if (game.phase === "playcall") game.hike(selectedPlay);
        else if (game.phase === "fg") game.lockKick();
        else if (game.phase === "pat" && game.patFor === "player") game.choosePat("kick");
        else if (game.phase === "celebrate" || game.phase === "quarter" || game.phase === "halftime") game.advance();
      }
      if (game.phase === "playcall" && input.aEdge) {
        game.hike(selectedPlay);
        selectedPlay = null;
        input.aEdge = false;
      }
      if (game.phase === "pat" && game.patFor === "player" && input.aEdge) {
        game.choosePat("kick");
        input.aEdge = false;
      }
      if (game.phase === "pat" && game.patFor === "player" && input.bEdge) {
        game.choosePat("two");
        input.bEdge = false;
      }
      if (game.phase === "fg" && input.aEdge) { game.lockKick(); input.aEdge = false; }
      if ((game.phase === "celebrate" || game.phase === "quarter" || game.phase === "halftime") && input.aEdge) {
        game.advance();
        input.aEdge = false;
      }
      game.update(dt, input);
      while (game.sfxQ.length) audio.play(game.sfxQ.shift());
    }
    const snap = game.snapshot();
    if (field) field.draw(snap);
    syncHud(snap);
    syncCue(snap);
    if (paused || snap.phase !== builtPhase) buildOverlay(snap);
    if (snap.phase === "fg") {
      const needle = $("needle");
      if (needle && snap.fg) needle.style.left = `${snap.fg.meter * 100}%`;
    }
    if (snap.phase === "final") settleFinal();
  }
  requestAnimationFrame(frame);
}

function settleFinal() {
  if (finalHandled) return;
  finalHandled = true;
  const win = game.scores.player > game.scores.cpu;
  const scoreText = `${game.scores.player}–${game.scores.cpu}`;
  let note = win ? "You covered. Barely counts if it was ugly, but it counts." : "Final. The other sideline is cashing the check.";
  pendingTrophy = null;
  if (mode === "season" && season && !season.over) {
    const res = season.applyResult(win, `${game.scores.player}-${game.scores.cpu}`);
    pendingTrophy = res.trophy;
    if (res.champion) note = "Insura-Bowl champions. Lift it.";
    else if (res.eliminated) note = win
      ? "You won the game and still missed the tournament. Four wins. That's the rule."
      : "Season over. Claim denied. They will bring this up forever.";
    else note = `Season ${season.recordLine()}. Next week is waiting.`;
  } else if (win) {
    pendingTrophy = trophyFor(userTeam.id, cpuTeam.id, {});
    if (pendingTrophy) note = `Rivalry win. The ${pendingTrophy.name} is on the table.`;
  }
  const bucket = win
    ? (pendingTrophy && pendingTrophy.id === "umbrella" ? "championship" : pendingTrophy ? "rivalry" : "win")
    : "loss";
  const line = commentator.line(bucket);
  $("finalKicker").textContent = win ? "FINAL — WIN" : "FINAL — LOSS";
  $("finalScore").textContent = `${game.scores.player} – ${game.scores.cpu}`;
  $("finalNote").textContent = `${userTeam.short} ${scoreText} ${cpuTeam.short}. ${note}`;
  const s = game.stats;
  $("finalStats").innerHTML = [
    ["PASS YDS", Math.round(s.player.pass), Math.round(s.cpu.pass)],
    ["RUSH YDS", Math.round(s.player.rush), Math.round(s.cpu.rush)],
    ["TOUCHDOWNS", s.player.tds, s.cpu.tds],
    ["INTERCEPTIONS", s.player.ints, s.cpu.ints],
    ["SACKS ALLOWED", s.player.sacks, s.cpu.sacks],
    ["FIELD GOALS", s.player.fg, s.cpu.fg],
  ].map((r) => `<div class="statline"><span>${r[1]}</span><span>${r[0]}</span><span>${r[2]}</span></div>`).join("");
  $("finalPat").querySelector("span").textContent = line.pat;
  $("finalKenny").querySelector("span").textContent = line.kenny;
  $("liftBtn").classList.toggle("hidden", !pendingTrophy);
  const over = mode === "season" && season && season.over;
  $("finalNext").textContent = pendingTrophy ? "SKIP TROPHY" : over ? "SEASON RECAP" : mode === "season" ? "SEASON HUB" : "REMATCH";
  if (!win) audio.play("miss");
  show("final");
}

function openTrophy() {
  if (!pendingTrophy) return;
  $("trophyImg").src = pendingTrophy.img;
  $("trophyImg").alt = pendingTrophy.name;
  $("trophyCaption").textContent = pendingTrophy.caption;
  $("trophyPat").querySelector("span").textContent = pendingTrophy.pat;
  $("trophyKenny").querySelector("span").textContent = pendingTrophy.kenny;
  audio.play("hail");
  show("trophy");
}

function afterGameScreen() {
  if (mode === "season" && season) {
    renderHub();
    show("hub");
    audio.startMusic("title");
    return;
  }
  startMatch();
}

function bindHold(el, key) {
  const down = (e) => {
    e.preventDefault();
    unlock();
    if (el.setPointerCapture) el.setPointerCapture(e.pointerId);
    if (!hold[key]) {
      if (key === "a") aEdge = true;
      if (key === "b") bEdge = true;
    }
    hold[key] = true;
  };
  const up = (e) => {
    hold[key] = false;
    if (e && e.pointerId && el.releasePointerCapture) {
      try { el.releasePointerCapture(e.pointerId); } catch { /* already released */ }
    }
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("lostpointercapture", () => { hold[key] = false; });
}

function bindStick() {
  const el = $("stick");
  const knob = $("knob");
  let pid = null;
  let origin = null;
  const place = (ax, ay) => {
    const w = el.clientWidth || 132;
    const h = el.clientHeight || 132;
    const kw = knob.offsetWidth || 54;
    const kh = knob.offsetHeight || 54;
    const max = Math.max(8, (w - kw) / 2 - 6);
    knob.style.left = `${(w - kw) / 2 + ax * max}px`;
    knob.style.top = `${(h - kh) / 2 + ay * max}px`;
  };
  el.addEventListener("pointerdown", (e) => {
    unlock();
    pid = e.pointerId;
    el.setPointerCapture(pid);
    origin = { x: e.clientX, y: e.clientY };
    stick.active = true;
  });
  el.addEventListener("pointermove", (e) => {
    if (e.pointerId !== pid || !origin) return;
    const max = 46;
    stick.ax = Math.max(-1, Math.min(1, (e.clientX - origin.x) / max));
    stick.ay = Math.max(-1, Math.min(1, (e.clientY - origin.y) / max));
    place(stick.ax, stick.ay);
  });
  const end = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    stick = { ax: 0, ay: 0, active: false };
    place(0, 0);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function onKey(e, down) {
  const map = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    KeyW: "up", KeyS: "down", KeyA: "left", KeyD: "right",
  };
  if (map[e.code]) {
    e.preventDefault();
    hold[map[e.code]] = down;
    return;
  }
  if (!down) {
    if (e.code === "KeyZ" || e.code === "KeyJ" || e.code === "Space") hold.a = false;
    if (e.code === "KeyX" || e.code === "KeyK") hold.b = false;
    return;
  }
  if (e.code === "KeyZ" || e.code === "KeyJ" || e.code === "Space") {
    e.preventDefault();
    if (!hold.a) aEdge = true;
    hold.a = true;
  } else if (e.code === "KeyX" || e.code === "KeyK") {
    if (!hold.b) bEdge = true;
    hold.b = true;
  } else if (e.code === "Enter") {
    e.preventDefault();
    confirmEdge = true;
  } else if (e.code === "Escape" || e.code === "KeyP") {
    if (game && $("game").classList.contains("on")) {
      paused = !paused;
      builtPhase = "";
    }
  } else if (e.code >= "Digit1" && e.code <= "Digit6" && game && game.phase === "playcall") {
    const i = Number(e.code.slice(5)) - 1;
    const plays = game.offense === "player" ? OFF_PLAYS : DEF_PLAYS;
    if (plays[i]) {
      selectedPlay = plays[i].id;
      builtPhase = "";
    }
  }
}

function wire() {
  $("goPlay").addEventListener("click", () => {
    unlock();
    const saved = Season.load();
    $("modeContinue").classList.toggle("hidden", !saved || saved.over);
    show("mode");
  });
  $("goHow").addEventListener("click", () => show("how"));
  $("howBack").addEventListener("click", () => show("title"));
  $("muteTitle").addEventListener("click", () => { unlock(); setMute(!audio.muted); if (!audio.muted) audio.startMusic("title"); });
  $("modeBack").addEventListener("click", () => show("title"));
  $("modeEx").addEventListener("click", () => { mode = "exhibition"; season = null; show("team"); });
  $("modeSeason").addEventListener("click", () => { mode = "season"; show("team"); });
  $("modeContinue").addEventListener("click", () => {
    season = Season.load();
    if (!season) return;
    mode = "season";
    userTeam = season.team;
    renderHub();
    show("hub");
  });
  $("teamBack").addEventListener("click", () => show("mode"));
  $("oppBack").addEventListener("click", () => show("team"));
  $("hubQuit").addEventListener("click", () => { Season.clear(); season = null; show("title"); });
  $("hubPlay").addEventListener("click", () => {
    const g = season.current;
    if (!g) return;
    cpuTeam = TEAMS[g.opp];
    openPregame(g.label);
  });
  $("recvBtn").addEventListener("click", () => { receive = true; paintReceive(); });
  $("kickBtn").addEventListener("click", () => { receive = false; paintReceive(); });
  $("preBack").addEventListener("click", () => {
    if (mode === "season") { renderHub(); show("hub"); }
    else show("opp");
  });
  $("startGame").addEventListener("click", startMatch);
  $("pauseBtn").addEventListener("click", () => { paused = !paused; builtPhase = ""; });
  $("overlay").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || !game) return;
    unlock();
    const act = btn.dataset.act;
    const arg = btn.dataset.arg;
    if (act === "play") { selectedPlay = arg; builtPhase = ""; }
    else if (act === "hike") { game.hike(selectedPlay); selectedPlay = null; builtPhase = ""; }
    else if (act === "timeout") game.timeout("player");
    else if (act === "pat") game.choosePat(arg);
    else if (act === "lock") game.lockKick();
    else if (act === "skip") game.advance();
    else if (act === "resume") { paused = false; builtPhase = ""; }
    else if (act === "quit") { paused = false; game = null; show("title"); audio.startMusic("title"); }
  });
  $("liftBtn").addEventListener("click", openTrophy);
  $("finalNext").addEventListener("click", () => {
    if (pendingTrophy && !$("liftBtn").classList.contains("hidden")) {
      $("liftBtn").classList.add("hidden");
    }
    if (mode === "exhibition") startMatch();
    else afterGameScreen();
  });
  $("finalTitle").addEventListener("click", () => { game = null; show("title"); audio.startMusic("title"); });
  $("trophyNext").addEventListener("click", afterGameScreen);
  bindHold($("btnA"), "a");
  bindHold($("btnB"), "b");
  bindStick();
  window.addEventListener("keydown", (e) => onKey(e, true));
  window.addEventListener("keyup", (e) => onKey(e, false));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game && $("game").classList.contains("on")) { paused = true; builtPhase = ""; }
  });
  document.addEventListener("touchmove", (e) => {
    if ($("game").classList.contains("on")) e.preventDefault();
  }, { passive: false });
}

fillTeams();
try { if (localStorage.getItem("insura-mute") === "1") setMute(true); } catch { /* ignore */ }
wire();
audio.startMusic("title");
requestAnimationFrame(frame);

window.__IB = { Game, TEAMS, startMatch, get game() { return game; } };
