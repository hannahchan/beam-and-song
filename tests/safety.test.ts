import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons/specs';
import { buildParams } from '../src/engine/params';
import { computeScene, type SimInput } from '../src/engine/scenes';
import { sceneLuminance, saturatedRedArea } from '../src/safety/luminance';
import { analyzeLuminance, assertTimelineSafe } from '../src/safety/analyze';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import type { ChildSettings } from '../src/lib/types';

/**
 * SR-8 / TR-8 — the safety constraints are *verified*, not just designed.
 *
 * Every lesson is simulated headlessly at 60 fps and its whole-screen
 * luminance timeline is measured against the hard limits (SR-1 flashing,
 * SR-3 brightness/deltas, SR-5 saturated red) — at default settings, at the
 * most extreme settings a caregiver can reach (maximum size, brightness,
 * glow, speed, fastest pace, white and saturated-red targets), and under
 * input mashing on interactive lessons (SR-6).
 */

const FPS = 60;

function simulate(
  lessonId: string,
  settings: ChildSettings,
  seconds: number,
  tapsPerSec = 0,
): { lum: number[]; red: number[] } {
  const spec = LESSONS.find((l) => l.id === lessonId)!;
  const params = buildParams(settings);
  const taps: Array<{ t: number; x: number; y: number }> = [];
  if (tapsPerSec > 0) {
    // Switch presses (x = -1) always count as hits — the worst case for
    // reward-luminance, since every effective press blooms (SR-6).
    for (let t = 250; t < seconds * 1000; t += 1000 / tapsPerSec) taps.push({ t, x: -1, y: -1 });
  }
  // No measured luminance on the photo → the model assumes worst-case white.
  const sim: SimInput = { seed: 12345, taps, photos: [{ dataUrl: 'data:worst-case' }] };
  const lum: number[] = [];
  const red: number[] = [];
  for (let i = 0; i < seconds * FPS; i++) {
    const t = (i * 1000) / FPS;
    const scene = computeScene(spec, params, t, sim, ((i - 1) * 1000) / FPS);
    lum.push(sceneLuminance(scene));
    red.push(saturatedRedArea(scene));
  }
  return { lum, red };
}

function check(lessonId: string, settings: ChildSettings, seconds: number, tapsPerSec = 0, label = ''): void {
  const { lum, red } = simulate(lessonId, settings, seconds, tapsPerSec);
  const result = analyzeLuminance(lum, red, FPS);
  assertTimelineSafe(result, `${lessonId} ${label}`);
}

const EXTREME_BASE: ChildSettings = {
  ...DEFAULT_SETTINGS,
  size: 5,
  brightness: 3,
  glow: 3,
  movement: true,
  speed: 5,
  pace: 5,
  complexity: 3,
  biasStrength: 'strong',
};

describe('every lesson stays inside the hard safety limits (SR-1, SR-3, SR-5, SR-6)', () => {
  for (const lesson of LESSONS) {
    it(`${lesson.id} — default settings`, () => {
      check(lesson.id, DEFAULT_SETTINGS, 40, 0, 'defaults');
    });

    it(`${lesson.id} — extreme settings, white target (worst luminance)`, () => {
      check(lesson.id, { ...EXTREME_BASE, targetColor: 'white' }, 40, 0, 'extreme-white');
    });

    it(`${lesson.id} — extreme settings, saturated red target (SR-5)`, () => {
      check(lesson.id, { ...EXTREME_BASE, targetColor: 'red' }, 40, 0, 'extreme-red');
    });

    if (lesson.interactive) {
      it(`${lesson.id} — input mashing cannot create a flash (SR-6)`, () => {
        check(lesson.id, { ...EXTREME_BASE, targetColor: 'white' }, 30, 8, 'tap-spam');
      });
    }

    it(`${lesson.id} — movement off stays safe and static-friendly`, () => {
      check(lesson.id, { ...EXTREME_BASE, targetColor: 'white', movement: false }, 15, 0, 'no-movement');
    });
  }
});

describe('the analyzer itself catches hazards (so the green suite means something)', () => {
  it('flags a 5 Hz flicker', () => {
    const lum: number[] = [];
    for (let i = 0; i < FPS * 5; i++) {
      lum.push(Math.sin((2 * Math.PI * 5 * i) / FPS) > 0 ? 0.5 : 0.05);
    }
    const result = analyzeLuminance(lum, new Array(lum.length).fill(0), FPS);
    expect(() => assertTimelineSafe(result, 'synthetic strobe')).toThrow(/SAFETY VIOLATION/);
  });

  it('flags an abrupt hard cut', () => {
    const lum = [...new Array(FPS).fill(0.02), ...new Array(FPS).fill(0.5)];
    const result = analyzeLuminance(lum, new Array(lum.length).fill(0), FPS);
    expect(result.maxDeltaPer500ms).toBeGreaterThan(0.18);
  });

  it('flags saturated-red area flashing', () => {
    const red: number[] = [];
    for (let i = 0; i < FPS * 4; i++) red.push(Math.sin((2 * Math.PI * 2 * i) / FPS) > 0 ? 0.5 : 0);
    const result = analyzeLuminance(new Array(red.length).fill(0.2), red, FPS);
    expect(() => assertTimelineSafe(result, 'synthetic red strobe')).toThrow(/red/);
  });

  it('passes a gentle slow fade', () => {
    const lum: number[] = [];
    for (let i = 0; i < FPS * 10; i++) lum.push(0.2 * Math.min(1, i / (FPS * 2)));
    const result = analyzeLuminance(lum, new Array(lum.length).fill(0), FPS);
    expect(() => assertTimelineSafe(result, 'gentle fade')).not.toThrow();
  });
});
