import type { CustomAudio, MelodyId } from '../lib/types';
import { MELODIES, type Melody } from './melodies';
import { SAFETY } from '../safety/constants';
import { clamp } from './kernel';
import { getBlob } from '../lib/media';

/**
 * FR-10, where the sound sits. Pure and unit-tested: pan (-1..1) is a plain
 * left/right balance, and the target's screen height becomes a timbre cue
 * (higher on screen = brighter), which carries even on tablets whose
 * speakers can't render true elevation.
 *
 * Deliberately plain stereo, not HRTF 3D. HRTF is a headphone technique,
 * and the lessons' stated hardware is the device's own speakers (or one a
 * caregiver can place): over speakers its binaural cues wash out in room
 * crosstalk, while level panning moves energy between two real points in
 * the room, the strongest and most honest left/right cue a browser can
 * give. On headphones it trades "out in space" for an unmistakable side,
 * which is the lesson's actual point.
 */
export function spatialParams(pan: number, elevation = 0.5): { pan: number; filterHz: number } {
  const e = clamp(elevation, 0, 1); // 0 = top of screen
  return {
    pan: clamp(pan, -1, 1),
    filterHz: 1400 + 2600 * (1 - e),
  };
}

/**
 * All sound is synthesized with the Web Audio API, no audio files, nothing
 * to download or stutter (CR-2, TR-3). Envelopes always have gentle attacks
 * and releases (no clicks or startles), and a soft compressor keeps peaks
 * polite regardless of settings.
 *
 * The context is created on the first user gesture (TR-6) via unlock().
 */

type VoiceStyle = 'soft' | 'musicbox' | 'warm' | 'glass';

/**
 * Per-voice attack times. Every entry must sit at or above
 * SAFETY.MIN_AUDIO_ATTACK_S (no clicks, no startles; SR-2's audio analogue),
 * and note() re-floors them at runtime. Exported so tests enforce the floor.
 */
export const VOICE_ATTACK_S: Record<VoiceStyle, number> = {
  soft: 0.09,
  musicbox: 0.03,
  warm: 0.09,
  glass: 0.05,
};

/** One scheduled note of a cue: offset and duration in seconds. */
export interface CueNote {
  midi: number;
  at: number;
  dur: number;
  /** Scales the voice's usual peak (only ever downward or to 1). */
  peak?: number;
}

export interface CueSpec {
  voice: VoiceStyle;
  notes: readonly CueNote[];
  /** Fixed stage position (the two-character listening lessons); otherwise the caller's pan is used. */
  pan?: number;
}

/**
 * Every one-off sound a scene can cue, as plain data: deterministic, so the
 * same moment always carries the same sound (a landing with a stable sonic
 * identity is learnable; a coin-flip pitch is not), and testable without a
 * Web Audio context.
 *
 * The answer-and-attention cues (chime, note, invite, plink) speak in the
 * reserved 'glass' voice that no melody is allowed to use, so feedback reads
 * as its own instrument rather than three more notes of the bed. The
 * remaining cues are the listening lessons' own characters (CR-5); they keep
 * their contrasting voices and never share the stage with a bed.
 */
export const CUES: Record<string, CueSpec> = {
  chime: {
    voice: 'glass',
    notes: [
      { midi: 72, at: 0, dur: 0.5 },
      { midi: 76, at: 0.42, dur: 0.5 },
      { midi: 79, at: 0.84, dur: 1.4 },
    ],
  },
  plink: { voice: 'glass', notes: [{ midi: 76, at: 0, dur: 1.1 }] },
  note: { voice: 'glass', notes: [{ midi: 67, at: 0, dur: 0.9 }] },
  invite: { voice: 'glass', notes: [{ midi: 72, at: 0, dur: 0.8 }] },
  // The held light "singing": one low warm note, soft and unhurried.
  hum: { voice: 'warm', notes: [{ midi: 60, at: 0, dur: 1.5, peak: 0.55 }] },
  // The two-character listening lessons stage their voices fully to the
  // sides: half-pans (±0.5 is only ~8 dB between channels) washed out on
  // real speakers, and the side IS the content. ±0.9 leaves a whisper in
  // the far channel, unmistakable without being stark.
  bell: { voice: 'musicbox', pan: -0.9, notes: [{ midi: 76, at: 0, dur: 1.6 }] },
  drum: { voice: 'warm', pan: 0.9, notes: [{ midi: 48, at: 0, dur: 1.4 }] },
  // A little five-note call for the localization game (CR-5).
  call: {
    voice: 'musicbox',
    notes: [
      { midi: 60, at: 0, dur: 0.7 },
      { midi: 64, at: 0.55, dur: 0.7 },
      { midi: 67, at: 1.1, dur: 0.7 },
      { midi: 64, at: 1.65, dur: 0.7 },
      { midi: 60, at: 2.2, dur: 0.7 },
    ],
  },
  // Three soft, steady taps, rhythm as a character.
  beat: {
    voice: 'warm',
    pan: -0.9,
    notes: [
      { midi: 48, at: 0, dur: 0.5, peak: 0.8 },
      { midi: 48, at: 0.6, dur: 0.5, peak: 0.8 },
      { midi: 48, at: 1.2, dur: 0.5, peak: 0.8 },
    ],
  },
  // A short flowing line, melody as the other character.
  phrase: {
    voice: 'musicbox',
    pan: 0.9,
    notes: [
      { midi: 64, at: 0, dur: 0.65 },
      { midi: 67, at: 0.5, dur: 0.65 },
      { midi: 69, at: 1.0, dur: 0.65 },
      { midi: 72, at: 1.5, dur: 0.65 },
    ],
  },
  toneSoft: { voice: 'warm', notes: [{ midi: 57, at: 0, dur: 1.8, peak: 0.35 }] },
  toneFull: { voice: 'warm', notes: [{ midi: 57, at: 0, dur: 2.0, peak: 1.0 }] },
};

/**
 * The cues that answer the child's own touch or hold, the ones the
 * after-a-look mode keeps (everything else stays quiet there, FR-6b).
 */
export function isTapCue(name: string): boolean {
  return name === 'chime' || name === 'note' || name === 'hum';
}

export interface MelodyHandle {
  stop(fadeSec?: number): void;
  /** Move the music to the target: pan -1..1, elevation 0 (top) .. 1 (bottom). */
  setPan(p: number, elevation?: number): void;
  /** For "sound after a look" (FR-6b): play the next short phrase once. */
  playPhrase(): void;
}

/** The melody's spatial output: an input node plus a smooth position setter. */
interface SpatialChain {
  input: AudioNode;
  set(pan: number, elevation: number): void;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private duckGain: GainNode | null = null;
  /** The bed's own throttle: melodies and family songs pass through here, cues never do. */
  private bedGain: GainNode | null = null;
  private bedDuckedUntil = 0;
  private volume = 0.7;
  private timer: ReturnType<typeof setInterval> | null = null;
  private active: {
    melody: Melody;
    tempoScale: number;
    layered: boolean;
    noteIdx: number;
    nextTime: number;
    spatial: SpatialChain | null;
    loop: boolean;
    playing: boolean;
  } | null = null;

  /**
   * Build the melody's output: lowpass (elevation-as-brightness) into a
   * plain stereo panner (see spatialParams for why not HRTF). All movement
   * is smoothed, sound glides, it never jumps (SR-2 spirit).
   * Spatial chains carry beds only, so they hang off the bed bus.
   */
  private createSpatialChain(): SpatialChain | null {
    if (!this.ctx || !this.bedGain) return null;
    const ctx = this.ctx;
    const bedGain = this.bedGain;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = spatialParams(0).filterHz;

    const stereo = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    if (stereo) filter.connect(stereo).connect(bedGain);
    else filter.connect(bedGain);
    return {
      input: filter,
      set: (pan, elevation) => {
        const s = spatialParams(pan, elevation);
        stereo?.pan.setTargetAtTime(s.pan, ctx.currentTime, 0.25);
        filter.frequency.setTargetAtTime(s.filterHz, ctx.currentTime, 0.3);
      },
    };
  }

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
      this.master.gain.value = this.gain();
      this.master.connect(this.duckGain);
      // Beds (melodies, family songs) pass through their own gain so they can
      // step back under event sounds; cues and voice labels bypass it.
      this.bedGain = this.ctx.createGain();
      this.bedGain.connect(this.master);
    }
    if (this.ctx.state !== 'running') {
      try {
        await this.ctx.resume();
      } catch {
        /* stays locked until the next gesture */
      }
    }
  }

  /**
   * The volume setting is perceptual: loudness sense is roughly logarithmic,
   * so a linear gain spends most of its audible travel in the bottom third
   * of the slider. A squared taper spreads the steps evenly, and for any
   * given setting it only ever lowers the gain, never raises it.
   */
  private gain(): number {
    return this.volume * this.volume;
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(this.gain(), this.ctx.currentTime, 0.1);
    }
  }

  /** FR-12, soften everything immediately but smoothly. */
  duck(mult: number, sec = 0.35): void {
    if (this.duckGain && this.ctx) {
      this.duckGain.gain.setTargetAtTime(Math.max(0, mult), this.ctx.currentTime, sec / 3);
    }
  }

  /**
   * FR-12's little sibling, applied automatically: while an event sound
   * speaks, the bed steps back (roughly -10 dB) and then breathes back in,
   * so feedback is never three more notes inside the tune it lands on
   * (looking and listening compete, PR-11; the answer must win). Both moves
   * are smoothed gain ramps on the bed bus only. Overlapping cues extend
   * the dip rather than fighting it.
   */
  private duckBedFor(sec: number): void {
    if (!this.ctx || !this.bedGain) return;
    const t = this.ctx.currentTime;
    this.bedDuckedUntil = Math.max(this.bedDuckedUntil, t + sec);
    const g = this.bedGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.32, t, 0.07);
    g.setTargetAtTime(1, this.bedDuckedUntil, 0.25);
  }

  /** A fresh bed starts at full strength with no stale duck recovery pending. */
  private resetBed(): void {
    if (!this.ctx || !this.bedGain) return;
    this.bedDuckedUntil = 0;
    const g = this.bedGain.gain;
    g.cancelScheduledValues(this.ctx.currentTime);
    g.setTargetAtTime(1, this.ctx.currentTime, 0.1);
  }

  startMelody(
    id: MelodyId,
    opts: { tempoScale?: number; pan?: boolean; layered?: boolean; loop?: boolean } = {},
  ): MelodyHandle {
    const melody = MELODIES[id];
    this.stopMelody(0.25);
    if (!this.ctx || !this.master) return this.nullHandle();
    this.resetBed();

    const spatial = opts.pan ? this.createSpatialChain() : null;

    this.active = {
      melody,
      tempoScale: opts.tempoScale ?? 1,
      layered: opts.layered ?? false,
      noteIdx: 0,
      nextTime: this.ctx.currentTime + 0.15,
      spatial,
      loop: opts.loop ?? true,
      playing: opts.loop ?? true,
    };
    if (!this.timer) {
      this.timer = setInterval(() => this.pump(), 120);
    }
    return {
      stop: (fade = 0.4) => this.stopMelody(fade),
      setPan: (p, elevation = 0.5) => spatial?.set(p, elevation),
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
  private custom: { src: AudioBufferSourceNode; gain: GainNode } | null = null;
  private customOffset = 0; // where the next "after a look" snippet starts

  private loadBuffer(meta: { id: string }): Promise<AudioBuffer | null> {
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
    if (!this.ctx || !this.master || !this.bedGain) return this.nullHandle();
    this.resetBed();
    const ctx = this.ctx;
    const bedGain = this.bedGain;
    let stopped = false;
    const spatial = opts.pan ? this.createSpatialChain() : null;

    void this.loadBuffer(meta).then((buffer) => {
      if (stopped) return;
      if (!buffer) {
        this.startMelody(fallback, { pan: opts.pan, loop: opts.loop ?? true });
        return;
      }
      // loop:false means "after a look", only playPhrase() snippets sound.
      if (opts.loop === false) return;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = opts.loop ?? true;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.setTargetAtTime(0.5 * meta.gain, ctx.currentTime, 0.5); // ≥ soft attack (SR-2 analogue)
      src.connect(gain);
      gain.connect(spatial?.input ?? bedGain); // the family's song is a bed too: it ducks under cues
      src.start();
      this.custom = { src, gain };
    });

    return {
      stop: (fade = 0.5) => {
        stopped = true;
        this.stopCustom(fade);
      },
      setPan: (p, elevation = 0.5) => spatial?.set(p, elevation),
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

  /**
   * CR-3, a caregiver's short voice label ("the red ball!") as the answer in
   * photo lessons. Same gentle rules as every other sound: soft attack,
   * gentle release, normalized gain, and it shares the phrase guard, so a
   * voice label and a melody phrase can never stack on top of each other.
   */
  playVoiceLabel(blobId: string, gain: number): void {
    void this.playVoiceLabelAsync(blobId, gain);
  }

  private async playVoiceLabelAsync(blobId: string, gain: number): Promise<void> {
    if (!this.ctx || !this.master || this.phraseBusy) return;
    const buffer = await this.loadBuffer({ id: blobId });
    if (!buffer || !this.ctx || this.phraseBusy) return;
    this.phraseBusy = true;
    const ctx = this.ctx;
    const dur = Math.min(buffer.duration, 10);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const g = ctx.createGain();
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.setTargetAtTime(0.55 * gain, t, 0.08); // soft attack, well past the 30 ms floor
    g.gain.setTargetAtTime(0.0001, t + Math.max(dur - 0.4, 0.1), 0.2);
    src.connect(g).connect(this.master);
    src.start(t, 0, dur + 0.8);
    this.duckBedFor(dur + 0.3); // the voice is the answer; any bed steps back for it
    setTimeout(() => (this.phraseBusy = false), dur * 1000 + 300);
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
      if (midi > 0) this.note(midi, t, beats * secPerBeat, melody.voice, a?.spatial?.input ?? this.bedGain, a?.layered ?? false);
      t += beats * secPerBeat;
    }
    if (a) a.noteIdx = (start + count) % melody.notes.length;
    setTimeout(() => (this.phraseBusy = false), (t - this.ctx.currentTime) * 1000);
  }

  /** Lookahead scheduler. */
  private pump(): void {
    const a = this.active;
    if (!a || !a.playing || !this.ctx) return;
    // If the timer stalled (a throttled background tab), skip the missed
    // stretch rather than burst-scheduling the backlog into the past.
    if (a.nextTime < this.ctx.currentTime - 0.05) a.nextTime = this.ctx.currentTime + 0.1;
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
      if (midi > 0) this.note(midi, a.nextTime, beats * secPerBeat, a.melody.voice, a.spatial?.input ?? this.bedGain, a.layered);
      a.nextTime += beats * secPerBeat;
      a.noteIdx++;
    }
  }

  /**
   * One-off sounds cued by scenes, straight from the CUES table. Any bed
   * steps back for the cue's whole length and then breathes back in.
   */
  playCue(name: string, pan = 0): void {
    if (!this.ctx || !this.master) return;
    const cue = CUES[name];
    if (!cue) return;
    const t = this.ctx.currentTime + 0.03;
    const at = cue.pan ?? pan;
    let end = 0;
    for (const n of cue.notes) {
      this.note(n.midi, t + n.at, n.dur, cue.voice, null, false, at, n.peak ?? 1);
      end = Math.max(end, n.at + n.dur);
    }
    this.duckBedFor(end + 0.15);
  }

  /**
   * The Settings "left, then right" speaker check (FR-10/CR-5): the same
   * soft note fully to each side, so a caregiver can hear whether this
   * device truly separates the sides before trusting a lesson that calls
   * from one. Returns the check's length in seconds (0 when still locked).
   */
  stereoCheck(): number {
    if (!this.ctx || !this.master) return 0;
    const t = this.ctx.currentTime + 0.05;
    this.note(64, t, 0.9, 'glass', null, false, -0.9);
    this.note(64, t + 1.4, 0.9, 'glass', null, false, 0.9);
    this.duckBedFor(2.5);
    return 2.5;
  }

  /**
   * Synthesize one note. Attack always >= SAFETY.MIN_AUDIO_ATTACK_S; release
   * is long and smooth, nothing clicks, nothing startles. Beds pass their
   * own destination (the bed bus or its spatial chain); cues pass null and
   * land on the master via a fixed pan, outside the bed's duck.
   */
  private note(
    midi: number,
    at: number,
    durSec: number,
    style: VoiceStyle,
    destNode: AudioNode | null,
    layered: boolean,
    fixedPan = 0,
    peakScale = 1,
  ): void {
    if (!this.ctx || !this.master) return;
    const freq = 440 * Math.pow(2, (midi - 69) / 12);
    const dest = destNode ?? this.panFor(fixedPan);
    // 'glass' rings a little past its written length: a touch of air in
    // place of a reverb, so the one-off stings never feel clipped or abrupt.
    const releaseScale = style === 'glass' ? 1.2 : 0.9;

    const mkVoice = (f: number, type: OscillatorType, basePeak: number, filterHz: number) => {
      const peak = basePeak * peakScale;
      const osc = this.ctx!.createOscillator();
      osc.type = type;
      osc.frequency.value = f;
      const lp = this.ctx!.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filterHz;
      const g = this.ctx!.createGain();
      const attack = Math.max(VOICE_ATTACK_S[style], SAFETY.MIN_AUDIO_ATTACK_S);
      const release = Math.max(durSec * releaseScale, 0.35);
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
    } else if (style === 'glass') {
      // The reserved answer voice (see CUES): a clean fundamental with two
      // faint upper partials, brighter and simpler than 'musicbox', so
      // feedback reads as its own instrument even beside a bed in the same
      // register. Total peak stays at the other voices' headroom (~0.27).
      mkVoice(freq, 'sine', 0.2, 5200);
      mkVoice(freq * 2, 'sine', 0.05, 6200);
      mkVoice(freq * 3, 'sine', 0.018, 6800);
    } else {
      mkVoice(freq, 'sine', 0.24, 1900);
      if (layered) mkVoice(freq / 2, 'triangle', 0.08, 700); // soft octave pad (PR-8 layered)
    }
  }

  private panCache = new Map<number, StereoPannerNode | GainNode>();
  private panFor(p: number): AudioNode {
    if (!this.ctx || !this.master) throw new Error('audio not unlocked');
    // Eighth steps: coarse enough to reuse nodes, fine enough that a ±0.9
    // stage position stays strongly lateral instead of rounding down to 0.75.
    const key = Math.round(p * 8) / 8;
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
