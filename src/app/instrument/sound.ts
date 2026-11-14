// Optional machine sounds (off by default), synthesized with Web Audio so
// there are no audio files to ship.

import { store } from "./util";

const STORAGE_KEY = "im.sound";

let ac: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function ctx(): AudioContext | null {
  if (!ac) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ac = new AC();
  }
  if (ac.state === "suspended") void ac.resume();
  return ac;
}

export const sound = {
  on: store.get<boolean>(STORAGE_KEY, false) === true,

  toggle(value?: boolean): boolean {
    this.on = value ?? !this.on;
    store.set(STORAGE_KEY, this.on);
    if (this.on) ctx();
    return this.on;
  },

  /** A short filtered noise burst — a reel clicking into place. */
  flap(gain = 0.3): void {
    if (!this.on) return;
    const a = ctx();
    if (!a) return;
    if (!noise) {
      const len = Math.floor(a.sampleRate * 0.035);
      noise = a.createBuffer(1, len, a.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 5);
    }
    const src = a.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.75 + Math.random() * 0.5;
    const bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1600 + Math.random() * 1600;
    bp.Q.value = 0.8;
    const g = a.createGain();
    g.gain.value = gain;
    src.connect(bp).connect(g).connect(a.destination);
    src.start();
  },

  /** A tiny sine blip. */
  tick(freq = 1800, gain = 0.05, dur = 0.03): void {
    if (!this.on) return;
    const a = ctx();
    if (!a) return;
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  },
};
