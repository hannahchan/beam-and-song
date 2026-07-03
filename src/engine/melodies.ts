import type { MelodyId } from '../lib/types';

/**
 * All music is synthesized from note data — no audio files (CR-2, TR-3).
 * Songs are public-domain lullabies and nursery tunes.
 * Note tuple: [midi, beats]; midi 0 is a rest.
 */
export type Note = readonly [midi: number, beats: number];

export interface Melody {
  id: MelodyId;
  /** Slow by design (FR-7); validated against SAFETY.MAX_TEMPO_BPM. */
  bpm: number;
  /** Silent beats between repeats when looping. */
  restBeats: number;
  voice: 'soft' | 'musicbox' | 'warm';
  notes: readonly Note[];
}

const N = (midi: number, beats: number): Note => [midi, beats];

export const MELODIES: Record<MelodyId, Melody> = {
  /** Brahms — Wiegenlied (simplified). */
  brahms: {
    id: 'brahms',
    bpm: 60,
    restBeats: 4,
    voice: 'soft',
    notes: [
      N(64, 1), N(64, 1), N(67, 2.5), N(0, 0.5),
      N(64, 1), N(64, 1), N(67, 2.5), N(0, 0.5),
      N(64, 1), N(67, 1), N(72, 2), N(71, 1),
      N(69, 2), N(69, 1), N(67, 2.5), N(0, 0.5),
      N(62, 1), N(64, 1), N(65, 2), N(62, 1),
      N(62, 1), N(64, 1), N(65, 2.5), N(0, 0.5),
      N(62, 1), N(65, 1), N(71, 1), N(69, 1), N(67, 1), N(71, 1),
      N(72, 3.5),
    ],
  },

  /** Twinkle, Twinkle, Little Star. */
  twinkle: {
    id: 'twinkle',
    bpm: 70,
    restBeats: 3,
    voice: 'musicbox',
    notes: [
      N(60, 1), N(60, 1), N(67, 1), N(67, 1), N(69, 1), N(69, 1), N(67, 2),
      N(65, 1), N(65, 1), N(64, 1), N(64, 1), N(62, 1), N(62, 1), N(60, 2),
      N(67, 1), N(67, 1), N(65, 1), N(65, 1), N(64, 1), N(64, 1), N(62, 2),
      N(67, 1), N(67, 1), N(65, 1), N(65, 1), N(64, 1), N(64, 1), N(62, 2),
      N(60, 1), N(60, 1), N(67, 1), N(67, 1), N(69, 1), N(69, 1), N(67, 2),
      N(65, 1), N(65, 1), N(64, 1), N(64, 1), N(62, 1), N(62, 1), N(60, 2),
    ],
  },

  /** Frère Jacques. */
  frere: {
    id: 'frere',
    bpm: 72,
    restBeats: 3,
    voice: 'soft',
    notes: [
      N(60, 1), N(62, 1), N(64, 1), N(60, 1),
      N(60, 1), N(62, 1), N(64, 1), N(60, 1),
      N(64, 1), N(65, 1), N(67, 2),
      N(64, 1), N(65, 1), N(67, 2),
      N(67, 0.5), N(69, 0.5), N(67, 0.5), N(65, 0.5), N(64, 1), N(60, 1),
      N(67, 0.5), N(69, 0.5), N(67, 0.5), N(65, 0.5), N(64, 1), N(60, 1),
      N(60, 1), N(55, 1), N(60, 2),
      N(60, 1), N(55, 1), N(60, 2),
    ],
  },

  /** Mary Had a Little Lamb. */
  mary: {
    id: 'mary',
    bpm: 72,
    restBeats: 3,
    voice: 'soft',
    notes: [
      N(64, 1), N(62, 1), N(60, 1), N(62, 1), N(64, 1), N(64, 1), N(64, 2),
      N(62, 1), N(62, 1), N(62, 2), N(64, 1), N(67, 1), N(67, 2),
      N(64, 1), N(62, 1), N(60, 1), N(62, 1), N(64, 1), N(64, 1), N(64, 1), N(64, 1),
      N(62, 1), N(62, 1), N(64, 1), N(62, 1), N(60, 4),
    ],
  },

  /** Row, Row, Row Your Boat. */
  row: {
    id: 'row',
    bpm: 63,
    restBeats: 3,
    voice: 'soft',
    notes: [
      N(60, 1.5), N(60, 1.5), N(60, 1), N(62, 0.5), N(64, 1.5),
      N(64, 1), N(62, 0.5), N(64, 1), N(65, 0.5), N(67, 3),
      N(72, 0.5), N(72, 0.5), N(72, 0.5), N(67, 0.5), N(67, 0.5), N(67, 0.5),
      N(64, 0.5), N(64, 0.5), N(64, 0.5), N(60, 0.5), N(60, 0.5), N(60, 0.5),
      N(67, 1), N(65, 0.5), N(64, 1), N(62, 0.5), N(60, 3),
    ],
  },

  /** A wordless two-note sway for quiet tracking lessons. */
  humSway: {
    id: 'humSway',
    bpm: 56,
    restBeats: 2,
    voice: 'warm',
    notes: [
      N(57, 2), N(0, 1), N(64, 2), N(0, 1),
      N(57, 2), N(0, 1), N(62, 2), N(0, 1),
    ],
  },

  /** Reward motif for cause-and-effect (FR-9) — gentle rising arpeggio, soft attacks. */
  chime: {
    id: 'chime',
    bpm: 76,
    restBeats: 0,
    voice: 'musicbox',
    notes: [N(72, 0.6), N(76, 0.6), N(79, 1.8)],
  },

  /** Single raindrop notes, triggered by scene cues. */
  plinks: {
    id: 'plinks',
    bpm: 72,
    restBeats: 0,
    voice: 'musicbox',
    notes: [N(76, 1.2)],
  },

  /** Sparse pentatonic music-box notes for fireflies. */
  musicBox: {
    id: 'musicBox',
    bpm: 60,
    restBeats: 2,
    voice: 'musicbox',
    notes: [
      N(72, 1.5), N(0, 2), N(67, 1.5), N(0, 2.5), N(69, 1.5), N(0, 2),
      N(64, 1.5), N(0, 2.5), N(72, 1.5), N(0, 2), N(74, 1.5), N(0, 3),
    ],
  },

  /** Two contrasting gentle voices taking slow turns (Bell and Drum lesson, CR-5). */
  duet: {
    id: 'duet',
    bpm: 60,
    restBeats: 0,
    voice: 'soft',
    notes: [N(76, 2), N(0, 4), N(48, 2), N(0, 4)],
  },
};

/** Range checks used by tests: every pitched note stays in a gentle band. */
export const MELODY_NOTE_RANGE = { min: 45, max: 84 } as const; // A2..C6
