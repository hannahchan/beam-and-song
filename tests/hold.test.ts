import { describe, expect, it } from 'vitest';
import { effectiveHolds, holdEnvelope, makeRng } from '../src/engine/kernel';
import { computeScene, type SimInput } from '../src/engine/scenes';
import { buildParams } from '../src/engine/params';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import { HOLD_DRIVEN_BEHAVIORS, LESSONS } from '../src/lessons/specs';

/**
 * Hold-to-sustain (Keep the Light Singing): the kernel's slew-limited
 * envelope is the safety argument, no press pattern can flicker, because
 * the value physically cannot move faster than its ramps.
 */

const lesson = LESSONS.find((l) => HOLD_DRIVEN_BEHAVIORS.has(l.behavior))!;
const params = buildParams(DEFAULT_SETTINGS);
const sim = (holds: { start: number; end: number }[]): SimInput => ({ seed: 1, taps: [], holds });

describe('holdEnvelope, slew-limited by construction', () => {
  it('rises only while held, at the bounded rate, and saturates', () => {
    const holds = [{ start: 1000, end: 10_000 }];
    expect(holdEnvelope(1000, holds, 1000, 1500)).toBe(0);
    expect(holdEnvelope(1500, holds, 1000, 1500)).toBeCloseTo(0.5, 5);
    expect(holdEnvelope(2000, holds, 1000, 1500)).toBe(1);
    expect(holdEnvelope(9000, holds, 1000, 1500)).toBe(1);
  });

  it('settles after release at the bounded rate', () => {
    const holds = [{ start: 0, end: 2000 }];
    expect(holdEnvelope(2000, holds, 1000, 2000)).toBe(1);
    expect(holdEnvelope(3000, holds, 1000, 2000)).toBeCloseTo(0.5, 5);
    expect(holdEnvelope(4200, holds, 1000, 2000)).toBe(0);
  });

  it('an open-ended hold (finger still down) counts as held until now', () => {
    const holds = [{ start: 0, end: Number.POSITIVE_INFINITY }];
    expect(holdEnvelope(1100, holds, 1100, 1600)).toBe(1);
    expect(holdEnvelope(550, holds, 1100, 1600)).toBeCloseTo(0.5, 5);
  });

  it('no mash pattern can move it faster than the slew rate in any 500 ms window', () => {
    const rng = makeRng(3);
    const holds: { start: number; end: number }[] = [];
    let t = 0;
    while (t < 30_000) {
      const on = 60 + rng() * 500;
      holds.push({ start: t, end: t + on });
      t += on + 60 + rng() * 500;
    }
    const rise = 1100;
    const fall = 1600;
    const maxPer500 = 500 / Math.min(rise, fall) + 1e-9;
    for (let ms = 500; ms <= 30_000; ms += 50) {
      const delta = Math.abs(
        holdEnvelope(ms, holds, rise, fall) - holdEnvelope(ms - 500, holds, rise, fall),
      );
      expect(delta).toBeLessThanOrEqual(maxPer500);
    }
  });

  it('overlapping touches merge into one clean span, and give the same envelope', () => {
    const messy = [
      { start: 500, end: 1500 },
      { start: 1000, end: 2500 }, // second finger overlaps the first
      { start: 4000, end: 3000 }, // inverted span is dropped
    ];
    expect(effectiveHolds(messy, 10_000)).toEqual([{ start: 500, end: 2500 }]);
    for (const t of [800, 1600, 2600, 3500, 5000]) {
      expect(holdEnvelope(t, messy, 900, 1400)).toBeCloseTo(
        holdEnvelope(t, [{ start: 500, end: 2500 }], 900, 1400),
        8,
      );
    }
  });
});

describe('the hold lesson scene', () => {
  it('swells while held and settles to exactly its resting self after release', () => {
    const resting = computeScene(lesson, params, 20_000, sim([]));
    const during = computeScene(lesson, params, 12_000, sim([{ start: 8000, end: 60_000 }]));
    expect(during.items[0].alpha).toBeGreaterThan(resting.items[0].alpha * 1.5);
    const released = computeScene(lesson, params, 20_000, sim([{ start: 8000, end: 12_000 }]));
    expect(released.items[0].alpha).toBe(resting.items[0].alpha);
  });

  it('the bloom answers the hold, and only the hold', () => {
    expect(computeScene(lesson, params, 10_000, sim([])).items.some((i) => i.shape === 'bloom')).toBe(false);
    const held = computeScene(lesson, params, 12_000, sim([{ start: 8000, end: 60_000 }]));
    expect(held.items.some((i) => i.shape === 'bloom')).toBe(true);
  });

  it('hums arrive at a fixed slow cadence, and never for sub-350 ms dabs', () => {
    const collect = (holds: { start: number; end: number }[]): string[] => {
      const cues: string[] = [];
      for (let t = 0; t <= 8000; t += 100) {
        cues.push(...computeScene(lesson, params, t, sim(holds), t - 100).cues);
      }
      return cues.filter((c) => c === 'hum');
    };
    // One sustained hold from 1 s to 6 s: hums at 1350, 2600, 3850, 5100.
    expect(collect([{ start: 1000, end: 6000 }])).toHaveLength(4);
    // Frantic little dabs never settle long enough to earn a note.
    expect(
      collect([
        { start: 1000, end: 1200 },
        { start: 2000, end: 2180 },
        { start: 3000, end: 3300 },
      ]),
    ).toHaveLength(0);
  });
});
