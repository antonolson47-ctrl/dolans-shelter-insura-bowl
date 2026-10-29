/** Original beds. Chip drums stay under a brass, string, and timpani loop.
 * Cue map:
 *   title                         menus
 *   q1 Opening Kick               exhibition / regular Q1, plus a brass fanfare on the kickoff
 *   q2 Sideline Heat              Q2
 *   q3 Second Sun                 Q3, with a string swell out of halftime
 *   q4 Last Claim                 Q4 and overtime
 *   semi1..semi4 Wildcard         non-Bowl playoff, same quarter slots, darker and faster
 *   bowl Umbrella Anthem          every Insura-Bowl quarter, and the championship trophy lift
 * Gameplay stingers (whistle, hike, catch, crunch, td, fg, hail, …) are unchanged.
 */

const H = (n, steps) => Array(steps).fill(n);
const R = (steps) => Array(steps).fill(0);
const P = (...chunks) => chunks.flat();
const chordRun = (id, steps) => [id, ...Array(Math.max(0, steps - 1)).fill(-1)];
const hits = (n, step, value) => Array.from({ length: n }, (_, i) => (i % step === 0 ? value : 0));
const tile = (cell, n) => Array.from({ length: n }, (_, i) => cell[i % cell.length]);

const MARCH_KICK = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
const MARCH_SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
const MARCH_HAT = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0];
const DRIVE_KICK = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0];
const DRIVE_SNARE = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0];
const STAB_KICK = [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0];

function roll(pattern, from, value) {
  const next = pattern.slice();
  for (let i = from; i < next.length; i++) next[i] = value;
  return next;
}

const SONGS = {
  title: {
    bpm: 124,
    crowd: 0.012,
    crowdHz: 680,
    bass: [36, 0, 36, 43, 36, 0, 41, 0, 38, 0, 38, 45, 43, 0, 36, 41],
    lead: [67, 70, 72, 70, 67, 0, 74, 72, 70, 67, 65, 67, 72, 0, 70, 67],
    kick: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    hat: [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  },
  q1: {
    label: "Opening Kick",
    bpm: 102,
    orchestral: true,
    drum: 0.5,
    bassGain: 0.082,
    brassGain: 0.078,
    hornGain: 0.04,
    stringGain: 0.042,
    crowd: 0.022,
    crowdHz: 640,
    fanfare: [70, 74, 77, 82],
    swell: [70, 74, 77, 82],
    bass: P(H(46, 8), H(41, 8), H(51, 8), H(46, 8), H(41, 8), H(46, 4), H(50, 4), H(41, 8), H(46, 8)),
    brass: P(
      H(70, 6), H(74, 2), H(77, 4), H(74, 4),
      H(75, 4), H(74, 2), H(72, 2), H(70, 8),
      H(65, 4), H(70, 4), H(72, 4), H(74, 4),
      H(77, 6), H(75, 2), H(74, 4), H(70, 4),
    ),
    horn: P(
      H(66, 6), H(70, 2), H(72, 4), H(70, 4),
      H(70, 4), H(69, 2), H(67, 2), H(65, 8),
      H(60, 4), H(65, 4), H(67, 4), H(69, 4),
      H(72, 6), H(70, 2), H(69, 4), H(65, 4),
    ),
    chords: [
      [46, 53, 58, 65],
      [51, 58, 63, 70],
      [41, 48, 53, 57],
    ],
    harm: P(chordRun(0, 16), chordRun(1, 16), chordRun(2, 16), chordRun(0, 16)),
    timpani: hits(64, 8, 46),
    kick: tile(MARCH_KICK, 64),
    snare: tile(MARCH_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  q2: {
    label: "Sideline Heat",
    bpm: 120,
    orchestral: true,
    drum: 0.58,
    bassGain: 0.068,
    brassGain: 0.058,
    hornGain: 0.03,
    stringGain: 0.03,
    crowd: 0.026,
    crowdHz: 740,
    fanfare: [67, 70, 74, 79],
    swell: [62, 67, 70, 74],
    bass: P(H(43, 8), H(41, 8), H(48, 8), H(43, 8), H(46, 8), H(48, 8), H(38, 8), H(43, 8)),
    brass: P(
      H(67, 2), R(2), H(70, 2), R(2), H(74, 4), H(72, 2), H(70, 2),
      H(69, 2), R(2), H(67, 4), H(65, 2), R(2), H(62, 4),
      H(70, 4), H(69, 2), H(67, 2), H(66, 4), H(67, 4),
      H(74, 2), R(2), H(70, 2), R(2), H(69, 4), H(67, 4),
    ),
    horn: P(H(62, 8), H(58, 8), H(57, 8), H(55, 8), H(58, 8), H(57, 8), H(62, 8), H(55, 8)),
    chords: [
      [43, 50, 55, 62],
      [48, 55, 60, 67],
      [38, 45, 50, 57],
      [46, 53, 58, 65],
    ],
    harm: P(
      chordRun(0, 8), chordRun(0, 8),
      chordRun(1, 8), chordRun(2, 8),
      chordRun(3, 8), chordRun(1, 8),
      chordRun(2, 8), chordRun(0, 8),
    ),
    timpani: hits(64, 4, 43),
    kick: tile(DRIVE_KICK, 64),
    snare: tile(DRIVE_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  q3: {
    label: "Second Sun",
    bpm: 108,
    orchestral: true,
    drum: 0.4,
    bassGain: 0.064,
    brassGain: 0.06,
    hornGain: 0.032,
    stringGain: 0.044,
    crowd: 0.024,
    crowdHz: 820,
    fanfare: [74, 78, 81, 86],
    swell: [74, 78, 81, 86],
    bass: P(H(50, 16), H(55, 16), H(45, 16), H(50, 16)),
    brass: P(
      H(74, 8), H(78, 4), H(81, 4),
      H(79, 4), H(78, 4), H(76, 4), H(74, 4),
      H(69, 4), H(74, 4), H(76, 4), H(78, 4),
      H(81, 8), H(78, 4), H(74, 4),
    ),
    horn: P(H(69, 16), H(67, 16), H(62, 16), H(69, 8), H(66, 8)),
    chords: [
      [50, 57, 62, 69],
      [55, 62, 67, 74],
      [45, 52, 57, 64],
    ],
    harm: P(chordRun(0, 16), chordRun(1, 16), chordRun(2, 16), chordRun(0, 16)),
    timpani: (() => {
      const row = hits(64, 16, 50);
      row[56] = 50;
      row[60] = 50;
      return row;
    })(),
    kick: tile(MARCH_KICK, 64),
    snare: tile(MARCH_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  q4: {
    label: "Last Claim",
    bpm: 134,
    orchestral: true,
    drum: 0.68,
    bassGain: 0.072,
    brassGain: 0.072,
    hornGain: 0.036,
    stringGain: 0.034,
    crowd: 0.03,
    crowdHz: 520,
    fanfare: [64, 67, 71, 76],
    swell: [64, 71, 76, 79],
    bass: P(H(40, 16), H(40, 16), H(35, 8), H(40, 8), H(38, 8), H(40, 8)),
    brass: P(
      H(64, 2), R(2), H(67, 2), R(2), H(71, 2), R(2), H(67, 2), R(2),
      H(72, 2), R(2), H(71, 2), R(2), H(69, 2), R(2), H(67, 2), R(2),
      H(66, 2), R(2), H(67, 2), R(2), H(69, 4), H(64, 4),
      H(76, 2), R(2), H(75, 2), R(2), H(76, 4), H(71, 4),
    ),
    horn: P(H(59, 16), H(60, 16), H(59, 8), H(55, 8), H(64, 8), H(59, 8)),
    chords: [
      [40, 47, 52, 59],
      [45, 52, 57, 64],
      [47, 54, 59, 66],
      [36, 43, 48, 55],
      [38, 45, 50, 57],
    ],
    harm: P(
      chordRun(0, 16),
      chordRun(0, 16),
      chordRun(4, 8), chordRun(2, 8),
      chordRun(3, 8), chordRun(0, 8),
    ),
    timpani: roll(hits(64, 4, 40), 56, 40),
    kick: tile(STAB_KICK, 64),
    snare: tile(DRIVE_SNARE, 64),
    hat: tile([1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1], 64),
  },
  semi1: {
    label: "Wildcard Gate",
    bpm: 124,
    orchestral: true,
    drum: 0.62,
    bassGain: 0.082,
    brassGain: 0.078,
    hornGain: 0.038,
    stringGain: 0.04,
    crowd: 0.028,
    crowdHz: 610,
    fanfare: [72, 75, 79, 84],
    swell: [63, 67, 72, 79],
    bass: P(H(36, 16), H(41, 16), H(43, 8), H(36, 8), H(36, 16)),
    brass: P(
      H(72, 6), H(75, 2), H(79, 4), H(75, 4),
      H(77, 4), H(75, 2), H(74, 2), H(72, 8),
      H(68, 4), H(67, 4), H(65, 4), H(63, 4),
      H(74, 6), H(72, 2), H(71, 4), H(72, 4),
    ),
    horn: P(H(67, 8), H(63, 8), H(65, 8), H(60, 8), H(56, 8), H(55, 8), H(62, 8), H(60, 8)),
    chords: [
      [36, 43, 48, 55],
      [41, 48, 53, 60],
      [43, 50, 55, 62],
    ],
    harm: P(chordRun(0, 16), chordRun(1, 16), chordRun(2, 16), chordRun(0, 16)),
    timpani: hits(64, 8, 36),
    kick: tile(MARCH_KICK, 64),
    snare: tile(MARCH_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  semi2: {
    label: "Coverage",
    bpm: 136,
    orchestral: true,
    drum: 0.64,
    bassGain: 0.068,
    brassGain: 0.055,
    hornGain: 0.028,
    stringGain: 0.028,
    crowd: 0.03,
    crowdHz: 700,
    fanfare: [67, 70, 74, 79],
    swell: [60, 65, 67, 72],
    bass: P(H(43, 8), H(41, 8), H(36, 8), H(38, 8), H(43, 8), H(42, 8), H(36, 16)),
    brass: P(
      H(67, 2), R(2), H(68, 2), H(67, 4), H(63, 2), R(2), H(60, 2),
      H(65, 2), R(2), H(66, 2), H(65, 4), H(62, 2), R(2), H(60, 2),
      H(75, 4), H(74, 2), H(72, 2), H(71, 4), H(72, 4),
      H(68, 6), H(67, 2), H(63, 4), H(60, 4),
    ),
    horn: P(H(55, 8), H(53, 8), H(48, 8), H(50, 8), H(55, 8), H(54, 8), H(48, 16)),
    chords: [
      [43, 50, 55, 62],
      [41, 48, 53, 60],
      [38, 45, 50, 57],
      [36, 43, 48, 55],
    ],
    harm: P(
      chordRun(0, 8), chordRun(1, 8),
      chordRun(3, 8), chordRun(2, 8),
      chordRun(0, 8), chordRun(2, 8),
      chordRun(3, 8), chordRun(3, 8),
    ),
    timpani: hits(64, 4, 43),
    kick: tile(DRIVE_KICK, 64),
    snare: tile(DRIVE_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  semi3: {
    label: "Night Half",
    bpm: 116,
    orchestral: true,
    drum: 0.46,
    bassGain: 0.066,
    brassGain: 0.058,
    hornGain: 0.03,
    stringGain: 0.04,
    crowd: 0.026,
    crowdHz: 760,
    fanfare: [69, 72, 76, 81],
    swell: [69, 72, 76, 81],
    bass: P(H(45, 16), H(38, 16), H(40, 16), H(45, 16)),
    brass: P(
      H(69, 8), H(72, 4), H(76, 4),
      H(74, 4), H(72, 4), H(71, 4), H(69, 4),
      H(64, 4), H(69, 4), H(71, 4), H(72, 4),
      H(76, 8), H(72, 4), H(69, 4),
    ),
    horn: P(H(64, 16), H(62, 16), H(59, 16), H(64, 8), H(61, 8)),
    chords: [
      [45, 52, 57, 64],
      [38, 45, 50, 57],
      [40, 47, 52, 59],
    ],
    harm: P(chordRun(0, 16), chordRun(1, 16), chordRun(2, 16), chordRun(0, 16)),
    timpani: hits(64, 8, 45),
    kick: tile(MARCH_KICK, 64),
    snare: tile(MARCH_SNARE, 64),
    hat: tile(MARCH_HAT, 64),
  },
  semi4: {
    label: "Final Notice",
    bpm: 148,
    orchestral: true,
    drum: 0.74,
    bassGain: 0.07,
    brassGain: 0.054,
    hornGain: 0.026,
    stringGain: 0.026,
    crowd: 0.032,
    crowdHz: 500,
    fanfare: [72, 75, 79, 84],
    swell: [60, 64, 67, 72],
    bass: P(H(36, 8), H(35, 8), H(36, 8), H(34, 8), H(36, 8), H(43, 8), H(35, 8), H(36, 8)),
    brass: P(
      H(72, 2), R(2), H(75, 2), R(2), H(79, 2), R(2), H(75, 2), R(2),
      H(82, 2), R(2), H(79, 2), R(2), H(77, 2), R(2), H(75, 2), R(2),
      H(71, 2), R(2), H(72, 4), R(2), H(68, 2), R(2), H(67, 2),
      H(64, 2), R(2), H(63, 2), H(64, 4), R(4), H(60, 2),
    ),
    horn: P(H(60, 8), H(58, 8), H(55, 8), H(53, 8), H(60, 8), H(58, 8), H(55, 8), H(48, 8)),
    chords: [
      [36, 43, 48, 55],
      [37, 44, 49, 56],
      [43, 50, 55, 62],
      [41, 48, 53, 60],
    ],
    harm: P(
      chordRun(0, 8), chordRun(1, 8),
      chordRun(0, 8), chordRun(2, 8),
      chordRun(0, 8), chordRun(3, 8),
      chordRun(2, 8), chordRun(0, 8),
    ),
    timpani: roll(hits(64, 4, 36), 56, 36),
    kick: tile(STAB_KICK, 64),
    snare: tile([0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 1, 1, 0], 64),
    hat: tile([1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1], 64),
  },
  bowl: {
    label: "Umbrella Anthem",
    bpm: 90,
    orchestral: true,
    drum: 0.5,
    bassGain: 0.086,
    brassGain: 0.084,
    hornGain: 0.05,
    stringGain: 0.058,
    crowd: 0.02,
    crowdHz: 600,
    fanfare: [63, 67, 70, 75],
    swell: [63, 67, 70, 75],
    bass: P(
      H(39, 16), H(44, 16), H(46, 16), H(39, 16),
      H(36, 16), H(44, 16), H(46, 8), H(41, 8), H(39, 16),
    ),
    brass: P(
      H(63, 12), H(65, 4),
      H(67, 8), H(70, 8),
      H(68, 4), H(67, 4), H(65, 4), H(63, 4),
      H(70, 8), H(67, 4), H(63, 4),
      H(75, 6), H(74, 2), H(72, 4), H(70, 4),
      H(68, 8), H(70, 8),
      H(72, 4), H(70, 4), H(68, 4), H(67, 4),
      H(75, 8), H(70, 4), H(63, 4),
    ),
    horn: P(
      H(51, 16),
      H(51, 8), H(50, 8),
      H(48, 8), H(46, 8),
      H(51, 16),
      H(55, 8), H(56, 8),
      H(53, 8), H(55, 8),
      H(56, 8), H(58, 8),
      H(51, 16),
    ),
    chords: [
      [39, 46, 51, 58],
      [44, 51, 56, 63],
      [46, 53, 58, 65],
      [36, 43, 48, 55],
      [41, 48, 53, 60],
    ],
    harm: P(
      chordRun(0, 16),
      chordRun(1, 16),
      chordRun(2, 16),
      chordRun(0, 16),
      chordRun(3, 16),
      chordRun(1, 16),
      chordRun(2, 8), chordRun(4, 8),
      chordRun(0, 16),
    ),
    timpani: (() => {
      const row = Array.from({ length: 128 }, (_, i) => (i % 8 === 0 ? 39 : 0));
      for (let i = 120; i < 128; i++) row[i] = 39;
      return row;
    })(),
    kick: Array.from({ length: 128 }, (_, i) => (i % 16 === 0 ? 1 : 0)),
    snare: Array.from({ length: 128 }, (_, i) => (i % 16 === 8 ? 1 : 0)),
    hat: Array.from({ length: 128 }, (_, i) => (i % 4 === 0 ? 1 : 0)),
  },
};

function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

/** Steps a note occupies if `step` is its attack. Rests and ties return 0. */
export function noteLen(pattern, step) {
  const n = pattern.length;
  if (!n) return 0;
  const idx = ((step % n) + n) % n;
  const cur = pattern[idx];
  if (!cur) return 0;
  if (idx > 0 && pattern[idx - 1] === cur) return 0;
  let len = 1;
  while (idx + len < n && pattern[idx + len] === cur) len += 1;
  return len;
}

export function bedName(round, quarter) {
  const q = Math.min(4, Math.max(1, quarter || 1));
  if (round === "insura") return "bowl";
  if (round === "semi") return `semi${q}`;
  return `q${q}`;
}

export function validateSongs() {
  const errors = [];
  const prints = new Map();
  const tempos = new Map();
  for (const [name, song] of Object.entries(SONGS)) {
    const n = song.bass.length;
    for (const key of ["lead", "brass", "horn", "kick", "snare", "hat", "timpani", "harm"]) {
      if (song[key] && song[key].length !== n) errors.push(`${name}.${key} ${song[key].length} != bass ${n}`);
    }
    if (song.orchestral) {
      if (!song.brass || !song.horn || !song.timpani) errors.push(`${name} missing a choir line`);
      if (!song.chords || !song.harm || !song.fanfare || !song.swell) errors.push(`${name} missing pad or sting`);
      for (const id of song.harm) {
        if (id >= 0 && !song.chords[id]) errors.push(`${name} missing chord ${id}`);
      }
      const print = song.brass.join(",");
      if (prints.has(print)) errors.push(`${name} brass duplicates ${prints.get(print)}`);
      prints.set(print, name);
      if (tempos.has(song.bpm)) errors.push(`${name} bpm duplicates ${tempos.get(song.bpm)}`);
      tempos.set(song.bpm, name);
    }
  }
  for (const name of ["title", "q1", "q2", "q3", "q4", "semi1", "semi2", "semi3", "semi4", "bowl"]) {
    if (!SONGS[name]) errors.push(`missing ${name}`);
  }
  if (SONGS.bowl && SONGS.q1 && SONGS.bowl.brass.length === SONGS.q1.brass.length && SONGS.bowl.bpm >= SONGS.q1.bpm) {
    errors.push("bowl should sit slower than the opening kick");
  }
  return errors;
}

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.theme = null;
    this.song = null;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.orch = null;
    this.crowd = null;
    this.crowdGain = null;
    this.crowdFilter = null;
    this.crowdBase = 0;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 1;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.master);
      this.orch = this.ctx.createGain();
      this.orch.gain.value = 0.0001;
      const hp = this.ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 70;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.knee.value = 8;
      comp.ratio.value = 2.5;
      comp.attack.value = 0.005;
      comp.release.value = 0.18;
      this.orch.connect(hp);
      hp.connect(comp);
      comp.connect(this.musicGain);
      this.installCrowd();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  installCrowd() {
    const seconds = 1;
    const rate = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, Math.floor(rate * seconds), rate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 680;
    filter.Q.value = 0.7;
    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0;
    src.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.musicGain);
    src.start();
    this.crowd = src;
    this.crowdFilter = filter;
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  startMusic(name) {
    this.unlock();
    if (!this.ctx) return;
    if (name === "game") name = "q1";
    if (name === "playoff") name = "semi1";
    if (this.theme === name) return;
    const had = this.theme;
    this.theme = null;
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.song = SONGS[name] || SONGS.q1;
    this.theme = SONGS[name] ? name : "q1";
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    this.crowdBase = this.song.crowd ?? (this.theme === "title" ? 0.012 : 0.024);
    this.setCrowd(this.crowdBase, this.song.crowdHz || 680);
    this.fadeOrch(!!this.song.orchestral, !!had);
    this.timer = setInterval(() => this.pump(), 60);
  }

  stopMusic() {
    this.theme = null;
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.crowdBase = 0;
    if (this.crowdGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.crowdGain.gain.cancelScheduledValues(t);
      this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t);
      this.crowdGain.gain.linearRampToValueAtTime(0.0001, t + 0.12);
    }
    this.fadeOrch(false, true);
  }

  fadeOrch(on, had) {
    if (!this.orch || !this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.orch.gain;
    g.cancelScheduledValues(t);
    const now = Math.max(0.0001, g.value || 0.0001);
    if (!on) {
      g.setValueAtTime(now, t);
      g.linearRampToValueAtTime(0.0001, t + 0.1);
      return;
    }
    g.setValueAtTime(had ? now : 0.0001, t);
    if (had) g.linearRampToValueAtTime(0.0001, t + 0.04);
    g.linearRampToValueAtTime(1, t + (had ? 0.2 : 0.28));
  }

  setCrowd(level, hz) {
    if (!this.crowdGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.crowdGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(Math.max(0.0001, level), t + 0.35);
    if (this.crowdFilter && hz) {
      const f = this.crowdFilter.frequency;
      f.cancelScheduledValues(t);
      f.setValueAtTime(Math.max(80, f.value || 680), t);
      f.linearRampToValueAtTime(hz, t + 0.4);
    }
  }

  pump() {
    if (!this.ctx || !this.song) return;
    if (this.muted) {
      this.nextTime = this.ctx.currentTime + 0.05;
      return;
    }
    const horizon = this.ctx.currentTime + 0.28;
    const stepDur = 60 / this.song.bpm / 4;
    let guard = 0;
    while (this.nextTime < horizon && guard < 16) {
      this.scheduleStep(this.nextTime);
      this.nextTime += stepDur;
      this.step += 1;
      guard += 1;
    }
  }

  scheduleStep(time) {
    if (this.song.orchestral) {
      this.scheduleOrchestral(time);
      return;
    }
    this.scheduleChip(time);
  }

  scheduleChip(time) {
    const song = this.song;
    const i = this.step;
    const n = song.bass.length;
    const bass = song.bass[i % n];
    const lead = song.lead[i % n];
    if (bass) this.toneAt(time, midi(bass), 0.16, "triangle", 0.11, null, this.musicGain);
    if (lead && i % 2 === 0) this.toneAt(time, midi(lead), 0.13, "square", 0.045, midi(lead) * 1.01, this.musicGain);
    if (i % 8 === 0 && bass) {
      this.toneAt(time, midi(bass + 12), 0.18, "square", 0.02, null, this.musicGain);
      this.toneAt(time, midi(bass + 15), 0.18, "square", 0.016, null, this.musicGain);
    }
    if (song.kick[i % n]) this.kickDrum(time);
    if (song.snare[i % n]) this.noiseAt(time, 0.08, 0.05, 1800);
    if (song.hat[i % n]) this.noiseAt(time, 0.03, 0.02, 6000);
  }

  scheduleOrchestral(time) {
    const song = this.song;
    const n = song.bass.length;
    const i = this.step;
    const idx = i % n;
    const stepDur = 60 / song.bpm / 4;
    const bus = this.orch || this.musicGain;
    const drum = song.drum ?? 0.45;
    if (song.kick[idx]) {
      this.kickDrum(time, drum, bus);
      const root = song.bass[idx] || 48;
      this.toneAt(time, midi(root + 12), 0.05, "square", 0.016 * drum, null, bus);
    }
    if (song.snare[idx]) this.noiseAt(time, 0.07, 0.045 * drum, 1700, bus);
    if (song.hat[idx]) this.noiseAt(time, 0.025, 0.018 * drum, 6400, bus);
    if (song.timpani && song.timpani[idx]) this.timpaniAt(time, song.timpani[idx], bus);
    const bassLen = noteLen(song.bass, i);
    if (bassLen) this.sectionAt(time, [midi(song.bass[idx])], stepDur * bassLen * 0.97, song.bassGain ?? 0.07, "bass", bus);
    const brassLen = song.brass ? noteLen(song.brass, i) : 0;
    if (brassLen) this.sectionAt(time, [midi(song.brass[idx])], stepDur * brassLen * 0.98, song.brassGain ?? 0.06, "brass", bus);
    const hornLen = song.horn ? noteLen(song.horn, i) : 0;
    if (hornLen) this.sectionAt(time, [midi(song.horn[idx])], stepDur * hornLen * 0.98, song.hornGain ?? 0.032, "horn", bus);
    if (song.harm && song.harm[idx] >= 0) {
      let len = 1;
      while (idx + len < n && song.harm[idx + len] < 0) len += 1;
      const freqs = song.chords[song.harm[idx]].map(midi);
      this.sectionAt(time, freqs, stepDur * len * 0.99, song.stringGain ?? 0.034, "string", bus);
    }
  }

  duck(seconds = 1.15) {
    if (!this.ctx || !this.musicGain) return;
    const t = this.ctx.currentTime;
    const g = this.musicGain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.2, g.value), t);
    g.linearRampToValueAtTime(0.22, t + 0.04);
    g.linearRampToValueAtTime(1, t + seconds);
  }

  swell() {
    if (!this.crowdGain || !this.ctx) return;
    const t = this.ctx.currentTime;
    const g = this.crowdGain.gain;
    const base = this.crowdBase || (this.theme === "title" ? 0.012 : 0.024);
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.linearRampToValueAtTime(0.12, t + 0.08);
    g.linearRampToValueAtTime(base, t + 1.3);
  }

  sectionAt(time, freqs, dur, gain, mode, bus) {
    if (!this.ctx || this.muted || !freqs || !freqs.length || !(dur > 0.03) || !(gain > 0)) return;
    const dest = bus || this.musicGain;
    if (!dest) return;
    const string = mode === "string";
    const bass = mode === "bass";
    const horn = mode === "horn";
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.Q.value = string ? 0.4 : bass ? 0.5 : 0.7;
    const g = this.ctx.createGain();
    const attack = bass ? 0.03 : string ? Math.min(0.36, dur * 0.32) : Math.min(0.08, Math.max(0.028, dur * 0.2));
    const open = bass ? 280 : string ? 900 : horn ? 1080 : 1700;
    const startF = bass ? 160 : string ? 240 : 320;
    const opened = time + Math.max(0.04, attack);
    filter.frequency.setValueAtTime(startF, time);
    filter.frequency.exponentialRampToValueAtTime(open, opened);
    if (!string && !bass) {
      const dullAt = time + Math.max(opened - time + 0.04, dur * 0.78);
      if (dullAt < time + dur - 0.02) {
        filter.frequency.setValueAtTime(open, dullAt);
        filter.frequency.exponentialRampToValueAtTime(Math.max(180, open * 0.7), time + dur);
      }
    }
    const release = Math.min(0.16, Math.max(0.04, dur * 0.16));
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(gain, time + attack);
    const sustainUntil = time + dur - release;
    if (sustainUntil > time + attack + 0.015) g.gain.setValueAtTime(gain, sustainUntil);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    filter.connect(g);
    g.connect(dest);
    const detunes = bass ? [-6, 6] : string ? [-14, -5, 6, 14] : horn ? [-6, 5] : [-8, 0, 7];
    const oscGain = bass ? 0.62 : string ? 0.15 : 0.22;
    const type = bass ? "triangle" : "sawtooth";
    for (const freq of freqs) {
      if (!(freq > 20)) continue;
      for (const cents of detunes) {
        const o = this.ctx.createOscillator();
        o.type = type;
        o.frequency.setValueAtTime(freq * Math.pow(2, cents / 1200), time);
        const og = this.ctx.createGain();
        og.gain.value = oscGain;
        o.connect(og);
        og.connect(filter);
        o.start(time);
        o.stop(time + dur + 0.04);
      }
      if (mode === "brass") {
        const sub = this.ctx.createOscillator();
        sub.type = "triangle";
        sub.frequency.setValueAtTime(freq * 0.5, time);
        const sg = this.ctx.createGain();
        sg.gain.value = 0.26;
        sub.connect(sg);
        sg.connect(filter);
        sub.start(time);
        sub.stop(time + dur + 0.04);
      }
    }
  }

  fanfare() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.2;
    const notes = (this.song && this.song.fanfare) || [70, 74, 77, 82];
    notes.forEach((n, i) => {
      this.sectionAt(t + i * 0.13, [midi(n), midi(n - 12)], 0.46, 0.07, "brass", this.sfxGain);
    });
    this.timpaniAt(t, notes[0] - 24, this.sfxGain);
    this.timpaniAt(t + notes.length * 0.13, notes[0] - 17, this.sfxGain);
  }

  halfSwell() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime + 0.42;
    const notes = (this.song && this.song.swell) || [74, 78, 81, 86];
    notes.forEach((n, i) => {
      this.sectionAt(t + i * 0.1, [midi(n)], 1.25, 0.05, "string", this.musicGain);
      this.sectionAt(t + i * 0.1, [midi(n)], 0.62, 0.055, "brass", this.musicGain);
    });
    this.timpaniAt(t + 0.28, notes[0] - 24, this.musicGain);
    this.swell();
  }

  toneAt(time, freq, dur, type, gain, slideTo, bus) {
    if (!this.ctx || this.muted) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(40, freq), time);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), time + dur);
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g);
    g.connect(bus || this.sfxGain);
    o.start(time);
    o.stop(time + dur + 0.02);
  }

  tone(freq, dur, type = "square", gain = 0.08, slideTo = null) {
    if (!this.ctx) return;
    this.toneAt(this.ctx.currentTime, freq, dur, type, gain, slideTo, this.sfxGain);
  }

  noiseAt(time, dur, gain, freq, bus) {
    if (!this.ctx || this.muted) return;
    const n = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = n.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(bus || this.sfxGain);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  noise(dur, gain = 0.08, freq = 800) {
    if (!this.ctx) return;
    this.noiseAt(this.ctx.currentTime, dur, gain, freq);
  }

  kickDrum(time, scale = 1, bus = null) {
    const dest = bus || this.musicGain;
    this.toneAt(time, 156, 0.09, "sine", 0.16 * scale, 48, dest);
    this.noiseAt(time, 0.04, 0.04 * scale, 400, dest);
  }

  timpaniAt(time, note, bus) {
    const freq = midi(typeof note === "number" && note > 24 ? note : 43);
    const dest = bus || this.musicGain;
    this.toneAt(time, freq * 1.45, 0.36, "sine", 0.16, freq * 0.74, dest);
    this.noiseAt(time, 0.08, 0.04, 200, dest);
  }

  play(name) {
    this.unlock();
    if (!this.ctx || this.muted) return;
    if (name === "fanfare") {
      this.fanfare();
      return;
    }
    if (name === "halfswell") {
      this.halfSwell();
      return;
    }
    const big = name === "td" || name === "crunch" || name === "kick" || name === "hail" || name === "fg";
    if (big) this.duck(name === "td" || name === "hail" ? 1.6 : 0.85);
    switch (name) {
      case "whistle":
        this.tone(1560, 0.16, "square", 0.07, 1880);
        this.tone(1880, 0.14, "sine", 0.05);
        this.duck(0.45);
        break;
      case "hike":
        this.noise(0.05, 0.1, 2800);
        this.tone(196, 0.07, "square", 0.08, 140);
        break;
      case "catch":
        this.tone(740, 0.06, "square", 0.07, 980);
        this.tone(1180, 0.08, "sine", 0.04);
        break;
      case "crunch":
        this.noise(0.2, 0.22, 380);
        this.tone(70, 0.22, "sine", 0.22, 36);
        this.tone(140, 0.08, "square", 0.06);
        this.swell();
        break;
      case "td":
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.2, "square", 0.08), i * 95);
        });
        this.swell();
        break;
      case "fg":
        this.tone(392, 0.08, "square", 0.07, 523);
        this.tone(784, 0.22, "square", 0.06);
        this.tone(1046, 0.18, "sine", 0.04);
        break;
      case "miss":
        this.tone(311, 0.16, "square", 0.06, 196);
        this.tone(155, 0.24, "sawtooth", 0.05);
        break;
      case "pick":
        this.tone(988, 0.07, "square", 0.08, 494);
        this.noise(0.09, 0.07, 2200);
        break;
      case "fumble":
        this.noise(0.12, 0.1, 700);
        this.tone(110, 0.14, "sawtooth", 0.06, 60);
        break;
      case "throw":
        this.tone(480, 0.05, "square", 0.05, 820);
        break;
      case "kick":
        this.tone(160, 0.12, "sine", 0.18, 50);
        this.noise(0.12, 0.16, 500);
        this.tone(90, 0.16, "triangle", 0.1, 40);
        this.swell();
        break;
      case "hail":
        [523, 659, 784, 1046].forEach((f) => this.tone(f, 0.5, "square", 0.045));
        this.swell();
        break;
      case "crowd":
        this.swell();
        break;
      default:
        break;
    }
  }
}
