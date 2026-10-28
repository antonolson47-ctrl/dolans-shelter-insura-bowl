/** Tiny chiptune synth. Unlocks on the first tap (iOS Safari). */

const THEMES = {
  title: {
    bpm: 132,
    bass: [43, 43, 50, 46, 43, 41, 46, 38],
    lead: [70, 74, 77, 74, 70, 65, 62, 65, 70, 74, 81, 77, 74, 70, 65, 62],
  },
  game: {
    bpm: 156,
    bass: [36, 36, 43, 41, 36, 36, 39, 43],
    lead: [60, 63, 67, 63, 60, 55, 58, 60, 67, 70, 67, 63, 60, 58, 55, 60],
  },
  playoff: {
    bpm: 168,
    bass: [34, 34, 41, 39, 34, 37, 41, 34],
    lead: [58, 65, 70, 65, 62, 58, 53, 58, 70, 74, 70, 65, 62, 58, 65, 70],
  },
};

function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
}

export class AudioBus {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicOn = false;
    this.theme = null;
    this.timer = null;
    this.step = 0;
    this.master = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.18;
  }

  startMusic(name) {
    this.unlock();
    if (!this.ctx || this.theme === name) return;
    this.stopMusic();
    const theme = THEMES[name] || THEMES.game;
    this.theme = name;
    this.musicOn = true;
    this.step = 0;
    const interval = (60 / theme.bpm) * 0.5 * 1000;
    this.timer = setInterval(() => this.tickMusic(theme), interval);
  }

  stopMusic() {
    this.musicOn = false;
    this.theme = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  tickMusic(theme) {
    if (!this.ctx || this.muted) return;
    const i = this.step++;
    const bass = theme.bass[i % theme.bass.length];
    const lead = theme.lead[i % theme.lead.length];
    if (i % 2 === 0) this.tone(midi(bass), 0.16, "square", 0.05);
    if (i % 2 === 0) this.tone(midi(lead), 0.14, "square", 0.035, midi(lead) * 0.99);
    if (i % 4 === 0) this.noise(0.04, 0.02, 1800);
  }

  tone(freq, dur, type = "square", gain = 0.08, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  noise(dur, gain = 0.08, freq = 800) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    const n = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
    const data = n.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = n;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  play(name) {
    this.unlock();
    if (!this.ctx || this.muted) return;
    switch (name) {
      case "whistle":
        this.tone(1480, 0.18, "square", 0.06, 1760);
        this.tone(1760, 0.12, "square", 0.04);
        break;
      case "hike":
        this.noise(0.06, 0.07, 2400);
        this.tone(220, 0.08, "square", 0.06);
        break;
      case "catch":
        this.tone(660, 0.07, "square", 0.06, 880);
        this.tone(990, 0.09, "square", 0.04);
        break;
      case "crunch":
        this.noise(0.22, 0.16, 420);
        this.tone(90, 0.18, "sawtooth", 0.08, 40);
        break;
      case "td":
        [523, 659, 784, 1046].forEach((f, i) => {
          setTimeout(() => this.tone(f, 0.18, "square", 0.07), i * 90);
        });
        break;
      case "fg":
        this.tone(392, 0.1, "square", 0.06, 523);
        this.tone(784, 0.2, "square", 0.05);
        break;
      case "miss":
        this.tone(330, 0.16, "square", 0.05, 220);
        this.tone(196, 0.22, "sawtooth", 0.04);
        break;
      case "pick":
        this.tone(880, 0.08, "square", 0.07, 440);
        this.noise(0.1, 0.06, 2000);
        break;
      case "fumble":
        this.noise(0.14, 0.09, 900);
        this.tone(140, 0.12, "sawtooth", 0.05);
        break;
      case "throw":
        this.tone(520, 0.06, "square", 0.05, 740);
        break;
      case "kick":
        this.tone(180, 0.1, "square", 0.06, 90);
        this.noise(0.08, 0.05, 600);
        break;
      case "hail":
        [523, 659, 784].forEach((f) => this.tone(f, 0.45, "square", 0.04));
        break;
      case "crowd":
        this.noise(0.35, 0.04, 700);
        break;
      default:
        break;
    }
  }
}
