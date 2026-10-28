/** Chiptune bed plus punchy stingers. Music ducks under hits and scores. */

const SONGS = {
  title: {
    bpm: 124,
    bass: [36, 0, 36, 43, 36, 0, 41, 0, 38, 0, 38, 45, 43, 0, 36, 41],
    lead: [67, 70, 72, 70, 67, 0, 74, 72, 70, 67, 65, 67, 72, 0, 70, 67],
    kick: [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0],
    hat: [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1],
  },
  game: {
    bpm: 146,
    bass: [36, 36, 0, 43, 36, 0, 41, 43, 34, 34, 0, 41, 39, 0, 36, 34],
    lead: [60, 0, 63, 67, 63, 60, 0, 70, 67, 63, 60, 0, 67, 70, 72, 67],
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    snare: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1],
    hat: [1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
  },
  playoff: {
    bpm: 160,
    bass: [34, 0, 34, 41, 34, 0, 46, 41, 32, 0, 39, 41, 34, 34, 41, 46],
    lead: [70, 74, 77, 74, 70, 0, 82, 77, 74, 70, 77, 74, 82, 0, 77, 74],
    kick: [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1],
    snare: [0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0],
    hat: [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1],
  },
};

function midi(n) {
  return 440 * Math.pow(2, (n - 69) / 12);
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
    this.crowd = null;
    this.crowdGain = null;
  }

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 1;
      this.musicGain.connect(this.master);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 1;
      this.sfxGain.connect(this.master);
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
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.9;
  }

  startMusic(name) {
    this.unlock();
    if (!this.ctx || this.theme === name) return;
    this.stopMusic();
    this.song = SONGS[name] || SONGS.game;
    this.theme = name;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.05;
    if (this.crowdGain) {
      this.crowdGain.gain.value = name === "title" ? 0.012 : 0.028;
    }
    this.timer = setInterval(() => this.pump(), 60);
  }

  stopMusic() {
    this.theme = null;
    this.song = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.crowdGain) this.crowdGain.gain.value = 0;
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
    const base = this.theme === "title" ? 0.012 : 0.028;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(0.12, t + 0.08);
    g.linearRampToValueAtTime(base, t + 1.3);
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

  noiseAt(time, dur, gain, freq) {
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
    g.connect(this.sfxGain);
    src.start(time);
    src.stop(time + dur + 0.02);
  }

  noise(dur, gain = 0.08, freq = 800) {
    if (!this.ctx) return;
    this.noiseAt(this.ctx.currentTime, dur, gain, freq);
  }

  kickDrum(time) {
    this.toneAt(time, 150, 0.09, "sine", 0.16, 48, this.musicGain);
    this.noiseAt(time, 0.04, 0.04, 400);
  }

  play(name) {
    this.unlock();
    if (!this.ctx || this.muted) return;
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
