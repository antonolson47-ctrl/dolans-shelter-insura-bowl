/** Pat Boom and Kenny South, spoken in sequence. The ticker shows the same words. */

function pickVoice(voices, who) {
  if (!voices || !voices.length) return null;
  const en = voices.filter((v) => /en(-|_)?/i.test(v.lang) || /english/i.test(v.name));
  const pool = en.length ? en : voices;
  const male = /male|daniel|alex|fred|david|gordon|rishi|arthur/i;
  const bright = /samantha|karen|victoria|moira|tessa|female|zira|google us/i;
  if (who === "pat") {
    return pool.find((v) => male.test(v.name)) || pool.find((v) => !bright.test(v.name)) || pool[0];
  }
  return pool.find((v) => bright.test(v.name)) || pool[pool.length - 1] || pool[0];
}

export class AnnouncerVoice {
  constructor() {
    this.queue = [];
    this.busy = false;
    this.muted = false;
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
    this.toast = () => {};
    this.toldUnsupported = false;
    this.toldMuted = false;
    if (this.supported) {
      window.speechSynthesis.addEventListener("voiceschanged", () => {
        window.speechSynthesis.getVoices();
      });
    }
  }

  stop() {
    this.queue = [];
    this.busy = false;
    if (this.supported) window.speechSynthesis.cancel();
  }

  setMuted(muted) {
    this.muted = muted;
    if (!muted) this.toldMuted = false;
    if (muted && this.supported) {
      this.queue = [];
      this.busy = false;
      window.speechSynthesis.cancel();
    }
  }

  /** Speak Pat, then Kenny. Lines already on screen. */
  speak(line) {
    if (!line) return;
    this.queue.push({ who: "pat", text: line.pat });
    this.queue.push({ who: "kenny", text: line.kenny });
    if (this.queue.length > 6) this.queue.splice(0, this.queue.length - 6);
    this.pump();
  }

  pump() {
    if (this.busy) return;
    if (!this.queue.length) return;
    if (!this.supported) {
      this.queue = [];
      if (!this.toldUnsupported) {
        this.toldUnsupported = true;
        this.toast("Voice unsupported here. The ticker still has the call.");
      }
      return;
    }
    if (this.muted) {
      this.queue = [];
      if (!this.toldMuted) {
        this.toldMuted = true;
        this.toast("Commentary voice is muted.");
      }
      return;
    }
    const item = this.queue.shift();
    const utter = new SpeechSynthesisUtterance(item.text);
    const voices = window.speechSynthesis.getVoices();
    const voice = pickVoice(voices, item.who);
    if (voice) utter.voice = voice;
    utter.pitch = item.who === "pat" ? 0.62 : 1.42;
    utter.rate = item.who === "pat" ? 0.94 : 1.12;
    utter.volume = 1;
    this.busy = true;
    const done = () => {
      this.busy = false;
      this.pump();
    };
    utter.onend = done;
    utter.onerror = done;
    try {
      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utter);
    } catch {
      done();
    }
  }
}
