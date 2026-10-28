import { Game, bigMoment } from "./sim.js";
import { TEAMS, trophyFor } from "./teams.js";
import { Commentator, BANKS } from "./commentary.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const banners = ["BOMB", "CRUNCH", "TOUCHDOWN", "PICK-SIX", "HAIL CLAIM"].map((main) => {
  if (main === "BOMB") return bigMoment({ td: true, bomb: true });
  if (main === "CRUNCH") return bigMoment({ crunch: true });
  if (main === "TOUCHDOWN") return bigMoment({ td: true });
  if (main === "PICK-SIX") return bigMoment({ td: true, pick: true });
  return bigMoment({ td: true, hail: true });
});
for (const b of banners) assert(b && b.main, "banner missing");
assert(bigMoment({ td: true, hail: true, pick: true }).main === "HAIL CLAIM", "hail priority");

assert(trophyFor("cyclodes", "okiestate", { rivalry: "clipboard" }).id === "clipboard", "clipboard");
assert(trophyFor("giants", "beagles", {}).id === "drum", "drum");
assert(trophyFor("cyclodes", "giants", { round: "insura" }).id === "umbrella", "umbrella beats bell");
assert(trophyFor("gilbert", "cornkings", { rivalry: "gcup" }).id === "gcup", "gcup");
assert(trophyFor("cyclodes", "baylord", {}) === null, "no trophy");

const com = new Commentator();
const seen = new Set();
let repeats = 0;
for (let i = 0; i < BANKS.td.length; i++) {
  const line = com.line("td");
  const id = line.pat;
  if (seen.has(id)) repeats += 1;
  seen.add(id);
  assert(line.pat && line.kenny, "empty line");
}
assert(repeats === 0, `td lines repeated early (${repeats})`);

function stickRight() {
  return { ax: 1, ay: 0, aEdge: false, bEdge: false, aDown: false, bDown: false };
}
function screenBall(g) {
  return g.visualFlip() ? 100 - g.ball.x : g.ball.x;
}
for (const receive of [true, false]) {
  const g = new Game({
    player: TEAMS.cyclodes,
    cpu: TEAMS.giants,
    bot: false,
    seed: receive ? 4 : 12,
    receive,
  });
  g.start(receive);
  let n = 0;
  while (g.phase !== "live" && n < 40) {
    if (g.phase === "celebrate" || g.phase === "quarter" || g.phase === "halftime") g.advance();
    else g.update(1 / 50, stickRight());
    n += 1;
  }
  assert(g.play && g.play.kind === "kickoff", "kickoff did not start");
  const flips = new Set();
  let prev = screenBall(g);
  let maxJump = 0;
  let sawCatch = false;
  for (let i = 0; i < 500 && g.phase === "live"; i++) {
    flips.add(g.visualFlip());
    g.update(1 / 50, stickRight());
    if (g.phase !== "live") break;
    const sx = screenBall(g);
    maxJump = Math.max(maxJump, Math.abs(sx - prev));
    prev = sx;
    if (g.play && g.play.caught) sawCatch = true;
  }
  assert(flips.size === 1, `kickoff view flipped mid-return (receive=${receive})`);
  assert(maxJump < 20, `kickoff camera jumped ${maxJump.toFixed(1)} yards`);
  assert(sawCatch || g.reasons.touchback, "kickoff ended without a catch or touchback");
}

const scores = [];
let failed = 0;
let tds = 0;
let crunch = 0;
const seeds = [7, 11, 21, 42, 99, 128, 256, 512];
for (const seed of seeds) {
  const home = seed % 2 ? TEAMS.cyclodes : TEAMS.giants;
  const away = seed % 3 ? TEAMS.gilbert : TEAMS.steerhorns;
  const game = new Game({ player: home, cpu: away, bot: true, seed, receive: seed % 2 === 0 });
  game.start(seed % 2 === 0);
  let steps = 0;
  let guard = 0;
  while (game.phase !== "final" && steps < 50000) {
    const prev = game.phase + ":" + game.quarter + ":" + Math.round(game.clock);
    game.update(1 / 50, null);
    steps += 1;
    if (game.phase + ":" + game.quarter + ":" + Math.round(game.clock) === prev) guard += 1;
    else guard = 0;
    if (guard > 400) {
      console.error("stuck", seed, game.phase, game.quarter, game.clock, game.play && game.play.kind, game.reasons);
      break;
    }
    for (const p of game.players) {
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error("NaN player");
    }
  }
  const total = game.scores.player + game.scores.cpu;
  scores.push(total);
  tds += game.stats.player.tds + game.stats.cpu.tds;
  crunch += game.reasons.crunch || 0;
  const ok = game.phase === "final" && total >= 3 && steps < 50000;
  if (!ok) {
    failed += 1;
    console.error("BAD GAME", { seed, phase: game.phase, scores: game.scores, steps, quarter: game.quarter, clock: game.clock, reasons: game.reasons });
  } else {
    console.log("game", seed, `${game.scores.player}-${game.scores.cpu}`, "steps", steps, "q", game.quarter, "td", game.stats.player.tds + game.stats.cpu.tds, "reasons", JSON.stringify(game.reasons));
  }
}
const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
console.log("avg total", avg.toFixed(1), "tds", tds, "crunch", crunch, "failed", failed);
assert(failed === 0, "a bot game did not finish");
assert(avg >= 20 && avg <= 130, `score pace out of range ${avg}`);
assert(tds >= seeds.length, "not enough touchdowns");
console.log("SELFTEST OK");
