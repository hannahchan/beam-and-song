import type { CustomAudio, MelodyId } from '../lib/types';
import { MELODIES, type Melody } from './melodies';
import { SAFETY } from '../safety/constants';
import { getBlob } from '../lib/media';

/**
 * All sound is synthesized with the Web Audio API — no audio files, nothing
 * to download or stutter (CR-2, TR-3). Envelopes always have gentle attacks
 * and releases (no clicks or startles), and a soft compressor keeps peaks
 * polite regardless of settings.
 *
 * The context is created on the first user gesture (TR-6) via unlock().
 */

type VoiceStyle = 'soft' | 'musicbox' | 'warm';

export interface MelodyHandle {
  stop(fadeSec?: number): void;
  setPan(p: number): void;
  /** For "sound after a look" (FR-6b): play the next short phrase once. */
  playPhrase(): void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckGain: GainNode | null = null;
  private volume = 0.7;
  private timer: ReturnType<typeof setInterval> | null = null;
  private active: {
    melody: Melody;
    tempoScale: number;
    layered: boolean;
    noteIdx: number;
    nextTime: number;
    panner: StereoPannerNode | null;
    loop: boolean;
    playing: boolean;
  } | null = null;

  get unlocked(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture at least once (TR-6). */
  async unlock(): Promise<void> {
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.knee.value = 18;
      comp.ratio.value = 5;
      comp.attack.value = 0.02;
      comp.release.value = 0.4;
      comp.connect(this.ctx.destination);
      this.duckGain = this.ctx.createGain();
      this.duckGain.connect(comp);
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.duckGain);
    }
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        /* stays locked until the next gesture */
      }
    }
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  /** FR-12 — soften everything immediately but smoothly. */
  duck(mult: number, sec = 0.35): void {
    if (this.duckGain && this.ctx) {
      this.duckGain.gain.setTargetAtTime(Math.max(0, mult), this.ctx.currentTime, sec / 3);
    }
  }

  startMelody(
    id: MelodyId,
    opts: { tempoScale?: number; pan?: boolean; layered?: boolean; loop?: boolean } = {},
  ): MelodyHandle {
    const melody = MELODIES[id];
    this.stopMelody(0.25);
    if (!this.ctx || !this.master) return this.nullHandle();

    const panner = opts.pan && this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panner) panner.connect(this.master);

    this.active = {
      melody,
      tempoScale: opts.tempoScale ?? 1,
      layered: opts.layered ?? false,
      noteIdx: 0,
      nextTime: this.ctx.currentTime + 0.15,
      panner,
      loop: opts.loop ?? true,
      playing: opts.loop ?? true,
    };
    if (!this.timer) {
      this.timer = setInterval(() => this.pump(), 120);
    }
    return {
      stop: (fade = 0.4) => this.stopMelody(fade),
      setPan: (p) => {
        if (panner && this.ctx) panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), this.ctx.currentTime, 0.25);
      },
      playPhrase: () => this.playPhrase(),
    };
  }

  stopMelody(fadeSec = 0.4): void {
    if (this.active) this.active.playing = false;
    this.active = null;
    this.stopCustom(fadeSec);
    // Scheduled notes decay on their own envelopes; the fade keeps tails gentle.
    if (this.duckGain && this.ctx) {
      this.duckGain.gain.setTargetAtTime(1, this.ctx.currentTime + fadeSec, 0.2);
    }
  }

  /* --------------- the family's own music (CR-3, blob-backed) --------------- */

  private bufferCache = new Map<string, Promise<AudioBuffer | null>>();
  private custom: { src: AudioBufferSourceNode; gain: GainNode; panner: StereoPannerNode | null } | null = null;
  private customOffset = 0; // where the next "after a look" snippet starts

  private loadBuffer(meta: CustomAudio): Promise<AudioBuffer | null> {
    let p = this.bufferCache.get(meta.id);
    if (!p) {
      p = (async () => {
        if (!this.ctx) return null;
        const blob = await getBlob(meta.id);
        if (!blob) return null;
        try {
          return await this.ctx.decodeAudioData(await blob.arrayBuffer());
        } catch {
          return null;
        }
      })();
      this.bufferCache.set(meta.id, p);
    }
    return p;
  }

  /**
   * Play one of the child's own recordings/songs as the session music.
   * Same gentle rules as the synth: slow fade-in, normalized gain, soft stop.
   * Returns a handle immediately; playback begins once the blob is decoded.
   * Falls back to the given built-in melody if the blob is missing.
   */
  startCustom(
    meta: CustomAudio,
    fallback: MelodyId,
    opts: { pan?: boolean; loop?: boolean } = {},
  ): MelodyHandle {
    this.stopMelody(0.25);
    if (!this.ctx || !this.master) return this.nullHandle();
    const ctx = this.ctx;
    const master = this.master;
    let stopped = false;
    let panner: StereoPannerNode | null = null;

    void this.loadBuffer(meta).then((buffer) => {
      if (stopped) return;
      if (!buffer) {
        this.startMelody(fallback, { pan: opts.pan, loop: opts.loop ?? true });
        return;
      }
      // loop:false means "after a look" — only playPhrase() snippets sound.
      if (opts.loop === false) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = opts.loop ?? true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.setTargetAtTime(0.5 * meta.gain, ctx.currentTime, 0.5); // ≥ soft attack (SR-2 analogue)
      panner = opts.pan && ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      src.connect(gain);
      (panner ? gain.connect(panner).connect(master) : gain.connect(master));
      src.start();
      this.custom = { src, gain, panner };
    });

    return {
      stop: (fade = 0.5) => {
        stopped = true;
        this.stopCustom(fade);
      },
      setPan: (p) => {
        if (panner) panner.pan.setTargetAtTime(Math.max(-1, Math.min(1, p)), ctx.currentTime, 0.25);
      },
      playPhrase: () => void this.playCustomSnippet(meta),
    };
  }

  private stopCustom(fadeSec: number): void {
    const c = this.custom;
    if (!c || !this.ctx) return;
    this.custom = null;
    c.gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, Math.max(fadeSec, 0.15) / 3);
    try {
      c.src.stop(this.ctx.currentTime + fadeSec + 0.6);
    } catch {
      /* already stopped */
    }
  }

  /** ~8 s of the family's song as an after-a-look reward, advancing each time. */
  private async playCustomSnippet(meta: CustomAudio): Promise<void> {
    if (!this.ctx || !this.master || this.phraseBusy) return;
    const buffer = await this.loadBuffer(meta);
    if (!buffer || !this.ctx || this.phraseBusy) return;
    this.phraseBusy = true;
    const ctx = this.ctx;
    const dur = Math.min(8, buffer.duration);
    const offset = this.customOffset % Math.max(buffer.duration - dur, 0.01);
    this.customOffset += dur;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.setTargetAtTime(0.5 * meta.gain, t, 0.3);
    gain.gain.setTargetAtTime(0.0001, t + dur - 1, 0.35);
    src.connect(gain).connect(this.master);
    src.start(t, offset, dur + 1);
    setTimeout(() => (this.phraseBusy = false), dur * 1000);
  }

  /** One short phrase as a reward-after-a-look (FR-6b / PR-11). */
  private phraseBusy = false;
  private playPhrase(): void {
    if (!this.ctx || !this.master || this.phraseBusy) return;
    const a = this.active;
    const melody = a?.melody ?? MELODIES.brahms;
    const tempo = (a?.tempoScale ?? 1) * melody.bpm;
    const secPerBeat = 60 / Math.min(tempo, SAFETY.MAX_TEMPO_BPM);
    let t = this.ctx.currentTime + 0.1;
    const start = a?.noteIdx ?? 0;
    const count = Math.min(8, melody.notes.length);
    this.phraseBusy = true;
    for (let i = 0; i < count; i++) {
      const [midi, beats] = melody.notes[(start + i) % melody.notes.length];
      if (midi > 0) this.note(midi, t, beats * secPerBeat, melody.voice, a?.panner ?? null, a?.layered ?? false);
      t += beats * secPerBeat;
    }
    if (a) a.noteIdx = (start + count) % melody.notes.length;
    setTimeout(() => (this.phraseBusy = false), (t - this.ctx.currentTime) * 1000);
  }

  /** Lookahead scheduler. */
  private pump(): void {
    const a = this.active;
    if (!a || !a.playing || !this.ctx) return;
    const secPerBeat = 60 / Math.min(a.melody.bpm * a.tempoScale, SAFETY.MAX_TEMPO_BPM);
    while (a.nextTime < this.ctx.currentTime + 0.4) {
      if (a.noteIdx >= a.melody.notes.length) {
        if (!a.loop) {
          a.playing = false;
          return;
        }
        a.noteIdx = 0;
        a.nextTime += a.melody.restBeats * secPerBeat;
        continue;
      }
      const [midi, beats] = a.melody.notes[a.noteIdx];
      if (midi > 0) this.note(midi, a.nextTime, beats * secPerBeat, a.melody.voice, a.panner, a.layered);
      a.nextTime += beats * secPerBeat;
      a.noteIdx++;
    }
  }

  /** One-off sounds cued by scenes (plink, chime notes, bell, drum). */
  playCue(name: string, pan = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + 0.03;
    switch (name) {
      case 'chime':
        this.note(72, t, 0.5, 'musicbox', null, false, pan);
        this.note(76, t + 0.42, 0.5, 'musicbox', null, false, pan);
        this.note(79, t + 0.84, 1.4, 'musicbox', null, false, pan);
        break;
      case 'plink':
        this.note(76 + (Math.random() < 0.5 ? 0 : 3), t, 1.1, 'musicbox', null, false, pan);
        break;
      case 'note':
        this.note(67, t, 0.9, 'soft', null, false, pan);
        break;
      case 'invite':
        this.note(72, t, 0.8, 'musicbox', null, false, pan);
        break;
      case 'bell':
        this.note(76, t, 1.6, 'musicbox', null, false, -0.5);
        break;
      case 'drum':
        this.note(48, t, 1.4, 'warm', null, false, 0.5);
        break;
      case 'call': {
        // A little five-note call for the localization game (CR-5).
        const motif = [60, 64, 67, 64, 60];
        motif.forEach((m, i) => this.note(m, t + i * 0.55, 0.7, 'musicbox', null, false, pan));
        break;
      }
      case 'beat':
        // Three soft, steady taps — rhythm as a character.
        for (let i = 0; i < 3; i++) this.note(48, t + i * 0.6, 0.5, 'warm', null, false, -0.4, 0.8);
        break;
      case 'phrase': {
        // A short flowing line — melody as the other character.
        const line = [64, 67, 69, 72];
        line.forEach((m, i) => this.note(m, t + i * 0.5, 0.65, 'musicbox', null, false, 0.4));
        break;
      }
      case 'toneSoft':
        this.note(57, t, 1.8, 'warm', null, false, 0, 0.35);
        break;
      case 'toneFull':
        this.note(57, t, 2.0, 'warm', null, false, 0, 1.0);
        break;
    }
  }

  /**
   * Synthesize one note. Attack always >= SAFETY.MIN_AUDIO_ATTACK_S; release
   * is long and smooth — nothing clicks, nothing startles.
   */
  private note(
    midi: number,
    at: number,
    durSec: number,
    style: VoiceStyle,
    panner: AudioNode | null,
    layered: boolean,
    fixedPan = 0,
    peakScale = 1,
  ): void {
    if (!this.ctx || !this.master) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const dest = panner ?? this.panFor(fixedPan);

    const mkVoice = (f: number, type: OscillatorType, basePeak: number, filterHz: number) => {
      const peak = basePeak * peakScale;
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filterHz;
      const g = this.ctx!.createGain();
      const attack = Math.max(style === 'musicbox' ? 0.03 : 0.09, SAFETY.MIN_AUDIO_ATTACK_S);
      const release = Math.max(durSec * 0.9, 0.35);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(peak, at + attack);
      g.gain.setTargetAtTime(0.0001, at + Math.max(durSec * 0.55, attack + 0.05), release / 3);
      osc.connect(lp).connect(g).connect(dest);
      osc.start(at);
      osc.stop(at + durSec + release + 0.5);
    };

    if (style === 'musicbox') {
      mkVoice(freq, 'sine', 0.22, 4200);
      mkVoice(freq * 2, 'sine', 0.05, 5200); // faint sparkle partial
    } else if (style === 'warm') {
      mkVoice(freq, 'triangle', 0.24, 900);
    } else {
      mkVoice(freq, 'sine', 0.24, 1900);
      if (layered) mkVoice(freq / 2, 'triangle', 0.08, 700); // soft octave pad (PR-8 layered)
    }
  }

  private panCache = new Map<number, StereoPannerNode | GainNode>();
  private panFor(p: number): AudioNode {
    if (!this.ctx || !this.master) throw new Error('audio not unlocked');
    const key = Math.round(p * 4) / 4;
    let node = this.panCache.get(key);
    if (!node) {
      if (this.ctx.createStereoPanner) {
        node = this.ctx.createStereoPanner();
        (node as StereoPannerNode).pan.value = key;
      } else {
        node = this.ctx.createGain();
      }
      node.connect(this.master);
      this.panCache.set(key, node);
    }
    return node;
  }

  private nullHandle(): MelodyHandle {
    return { stop: () => {}, setPan: () => {}, playPhrase: () => {} };
  }
}

export const audio = new AudioEngine();
