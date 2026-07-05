import { describe, expect, it } from 'vitest';
import { CUES, VOICE_ATTACK_S } from '../src/engine/audio';
import { MELODIES, MELODY_NOTE_RANGE } from '../src/engine/melodies';
import { CUE_DRIVEN_BEHAVIORS, effectiveAudioMode, LESSONS } from '../src/lessons/specs';
import { resolveLesson } from '../src/lessons/bands';
import { SAFETY } from '../src/safety/constants';

/**
 * The sound model: event sounds are data (deterministic, gentle, in their own
 * reserved voice), beds are flowing tunes that never pose as event markers,
 * and where the looking is the work the music waits. jsdom has no Web Audio,
 * so these guards hold the line structurally, the same way the safety suite
 * holds the visual line.
 */

const FEEDBACK_CUES = ['chime', 'note', 'invite', 'plink'] as const;

describe('cues are gentle, deterministic data', () => {
  for (const [name, cue] of Object.entries(CUES)) {
    it(`${name}: pitches, timing, and levels stay in the gentle band`, () => {
      expect(cue.notes.length).toBeGreaterThan(0);
      for (const n of cue.notes) {
        expect(n.midi, `${name} midi`).toBeGreaterThanOrEqual(MELODY_NOTE_RANGE.min);
        expect(n.midi, `${name} midi`).toBeLessThanOrEqual(MELODY_NOTE_RANGE.max);
        expect(n.at, `${name} offset`).toBeGreaterThanOrEqual(0);
        expect(n.dur, `${name} duration`).toBeGreaterThan(0);
        if (n.peak !== undefined) {
          expect(n.peak, `${name} peak`).toBeGreaterThan(0);
          expect(n.peak, `${name} peak`).toBeLessThanOrEqual(1);
        }
      }
      if (cue.pan !== undefined) {
        expect(Math.abs(cue.pan), `${name} pan`).toBeLessThanOrEqual(1);
      }
    });
  }

  it('the landing plink is one fixed note, a stable sonic identity, never a coin flip', () => {
    expect(CUES.plink.notes).toHaveLength(1);
  });

  it('every voice attack sits at or above the no-click floor (SR-2 audio analogue)', () => {
    for (const [voice, attack] of Object.entries(VOICE_ATTACK_S)) {
      expect(attack, voice).toBeGreaterThanOrEqual(SAFETY.MIN_AUDIO_ATTACK_S);
    }
  });
});

describe("feedback speaks in its own voice ('glass' is reserved)", () => {
  it('answer and attention cues all use the glass voice', () => {
    for (const name of FEEDBACK_CUES) {
      expect(CUES[name].voice, name).toBe('glass');
    }
  });

  it('no melody may borrow the glass voice, so a bed can never impersonate feedback', () => {
    for (const melody of Object.values(MELODIES)) {
      expect(melody.voice, melody.id).not.toBe('glass');
    }
  });

  it('the reward motifs are gone from the bed library entirely', () => {
    // A bed note-for-note identical to the reward camouflages the reward.
    expect('chime' in MELODIES).toBe(false);
    expect('plinks' in MELODIES).toBe(false);
  });
});

describe('beds are tunes, not event markers', () => {
  it('every melody a lesson can actually loop carries a real melodic line', () => {
    // A one- or two-pitch bed reads as "each ping marks a thing on screen".
    for (const base of LESSONS) {
      if (CUE_DRIVEN_BEHAVIORS.has(base.behavior)) continue; // never loops a bed
      for (const band of ['infant', 'child', 'teen'] as const) {
        const l = resolveLesson(base, band);
        const pitches = new Set(MELODIES[l.melody].notes.filter(([m]) => m > 0).map(([m]) => m));
        expect(pitches.size, `${l.id} (${band}) melody "${l.melody}"`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('the contingency lessons are bedless: the answer is the only sound', () => {
    for (const id of ['magic-touch', 'reach-for-the-light', 'keep-the-light-singing']) {
      const l = LESSONS.find((s) => s.id === id)!;
      expect(CUE_DRIVEN_BEHAVIORS.has(l.behavior), id).toBe(true);
    }
  });
});

describe('where the looking is the work, the music waits (FR-6/PR-11)', () => {
  const find = LESSONS.find((l) => l.id === 'find-the-star')!;
  const glow = LESSONS.find((l) => l.id === 'gentle-glow')!;

  it('"with" becomes after-a-look on the find/search lessons', () => {
    expect(effectiveAudioMode('with', find)).toBe('after');
    expect(effectiveAudioMode('with', glow)).toBe('with');
  });

  it('the quieter choices are always honoured as chosen', () => {
    expect(effectiveAudioMode('after', find)).toBe('after');
    expect(effectiveAudioMode('off', find)).toBe('off');
    expect(effectiveAudioMode('after', glow)).toBe('after');
    expect(effectiveAudioMode('off', glow)).toBe('off');
  });
});
