import { describe, expect, it } from 'vitest';
import { MELODIES, MELODY_NOTE_RANGE } from '../src/engine/melodies';
import { SAFETY } from '../src/safety/constants';

describe('music stays slow and gentle (FR-7, PR-8)', () => {
  for (const melody of Object.values(MELODIES)) {
    it(`${melody.id} — tempo, range, and note shapes`, () => {
      expect(melody.bpm).toBeLessThanOrEqual(SAFETY.MAX_TEMPO_BPM);
      expect(melody.notes.length).toBeGreaterThan(0);
      for (const [midi, beats] of melody.notes) {
        expect(beats).toBeGreaterThan(0);
        if (midi !== 0) {
          expect(midi).toBeGreaterThanOrEqual(MELODY_NOTE_RANGE.min);
          expect(midi).toBeLessThanOrEqual(MELODY_NOTE_RANGE.max);
        }
      }
    });
  }

  it('audio attacks can never click (SR-2 audio analogue)', () => {
    expect(SAFETY.MIN_AUDIO_ATTACK_S).toBeGreaterThanOrEqual(0.03);
  });
});
