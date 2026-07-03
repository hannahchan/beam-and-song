import { describe, expect, it } from 'vitest';
import { biasPoint, biasBandY, buildParams } from '../src/engine/params';
import { effectiveTaps, makeRng, safeMod } from '../src/engine/kernel';
import { computeScene, type SimInput } from '../src/engine/scenes';
import { LESSONS } from '../src/lessons/specs';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import { SAFETY } from '../src/safety/constants';

const spec = (id: string) => LESSONS.find((l) => l.id === id)!;

describe('field bias (PR-4)', () => {
  it('strong lower bias pulls points into the lower field', () => {
    const rng = makeRng(7);
    let below = 0;
    const n = 300;
    for (let i = 0; i < n; i++) {
      const pt = biasPoint(rng(), rng(), 'lower', 'strong');
      if (pt.y > 0.5) below++;
    }
    expect(below / n).toBeGreaterThan(0.85);
  });

  it('gentle bias still visits the other half sometimes', () => {
    const rng = makeRng(7);
    let above = 0;
    const n = 300;
    for (let i = 0; i < n; i++) {
      if (biasPoint(rng(), rng(), 'lower', 'gentle').y <= 0.5) above++;
    }
    expect(above).toBeGreaterThan(10);
  });

  it('no bias stays balanced', () => {
    const rng = makeRng(11);
    let sum = 0;
    const n = 500;
    for (let i = 0; i < n; i++) sum += biasPoint(rng(), rng(), 'none', 'gentle').y;
    expect(sum / n).toBeGreaterThan(0.42);
    expect(sum / n).toBeLessThan(0.58);
  });

  it('travel bands respect bias', () => {
    expect(biasBandY('lower', 'strong')).toBeGreaterThan(0.7);
    expect(biasBandY('upper', 'strong')).toBeLessThan(0.3);
    expect(biasBandY('none', 'gentle')).toBe(0.5);
  });

  it('firefly spots actually land in the biased region', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, fieldBias: 'lower', biasStrength: 'strong' });
    const sim: SimInput = { seed: 99, tapsMs: [] };
    const cycle = 2 * Math.max(params.fadeMs, 500) + params.holdMs + params.holdMs * 0.6;
    let below = 0;
    let seen = 0;
    for (let i = 0; i < 24; i++) {
      const t = i * cycle + params.fadeMs + params.holdMs / 2; // mid-hold
      const scene = computeScene(spec('firefly'), params, t, sim, t - 16);
      const item = scene.items[0];
      if (item) {
        seen++;
        if (item.y > 0.5) below++;
      }
    }
    expect(seen).toBeGreaterThan(12);
    expect(below / seen).toBeGreaterThan(0.8);
  });
});

describe('pacing & latency (PR-5, FR-7)', () => {
  it('slower pace means longer fades and holds, never below the safety floor', () => {
    const p1 = buildParams({ ...DEFAULT_SETTINGS, pace: 1 });
    const p5 = buildParams({ ...DEFAULT_SETTINGS, pace: 5 });
    expect(p1.fadeMs).toBeGreaterThan(p5.fadeMs);
    expect(p1.holdMs).toBeGreaterThan(p5.holdMs);
    expect(p5.fadeMs).toBeGreaterThanOrEqual(SAFETY.MIN_FADE_MS);
    expect(p1.tempoScale).toBeLessThan(p5.tempoScale);
  });

  it('modulation frequency is clamped at every pace', () => {
    for (const pace of [1, 2, 3, 4, 5] as const) {
      const p = buildParams({ ...DEFAULT_SETTINGS, pace });
      expect(p.modHz).toBeLessThanOrEqual(SAFETY.MAX_MOD_HZ);
      expect(p.modDepth).toBeLessThanOrEqual(SAFETY.MAX_MOD_DEPTH);
    }
  });

  it('safeMod clamps frequency and depth even when asked for hazards', () => {
    // Ask for a 10 Hz, full-depth wobble; the kernel must behave as 0.5 Hz, 0.1 depth.
    for (let i = 0; i < 200; i++) {
      const t = i * 0.016;
      const v = safeMod(t, 10, 5);
      expect(Math.abs(v)).toBeLessThanOrEqual(SAFETY.MAX_MOD_DEPTH + 1e-9);
      expect(v).toBeCloseTo(SAFETY.MAX_MOD_DEPTH * Math.sin(2 * Math.PI * SAFETY.MAX_MOD_HZ * t), 10);
    }
  });
});

describe('reward cooldown (SR-6)', () => {
  it('mashed taps collapse to the safety cooldown', () => {
    const taps = [0, 100, 200, 300, 1400, 1600, 3200, 3300];
    expect(effectiveTaps(taps)).toEqual([0, 1600, 3200]);
  });

  it('unsorted input is handled', () => {
    expect(effectiveTaps([3200, 0, 100])).toEqual([0, 3200]);
  });

  it('spamming Magic Touch produces bounded cues and items', () => {
    const params = buildParams(DEFAULT_SETTINGS);
    const taps: number[] = [];
    for (let t = 0; t < 10_000; t += 125) taps.push(t);
    const sim: SimInput = { seed: 1, tapsMs: taps };
    let chimes = 0;
    let maxItems = 0;
    for (let i = 0; i < 600; i++) {
      const t = (i * 1000) / 60;
      const scene = computeScene(spec('magic-touch'), params, t, sim, ((i - 1) * 1000) / 60);
      chimes += scene.cues.filter((c) => c === 'chime').length;
      maxItems = Math.max(maxItems, scene.items.length);
    }
    expect(chimes).toBeLessThanOrEqual(Math.ceil(10_000 / SAFETY.MIN_REWARD_COOLDOWN_MS));
    expect(maxItems).toBeLessThanOrEqual(4);
  });
});

describe('movement setting (PR-2)', () => {
  it('movement off keeps the drifting light perfectly still', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, movement: false });
    const sim: SimInput = { seed: 5, tapsMs: [] };
    const a = computeScene(spec('drifting-light'), params, 5000, sim);
    const b = computeScene(spec('drifting-light'), params, 25000, sim);
    expect(a.items[0].x).toBeCloseTo(b.items[0].x, 5);
    expect(a.items[0].y).toBeCloseTo(b.items[0].y, 5);
  });

  it('movement on actually travels', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, movement: true, speed: 3 });
    const sim: SimInput = { seed: 5, tapsMs: [] };
    const xs = new Set<number>();
    for (let t = 2000; t < 20000; t += 2000) {
      xs.add(Math.round(computeScene(spec('drifting-light'), params, t, sim).items[0]?.x * 100));
    }
    expect(xs.size).toBeGreaterThan(3);
  });
});

describe('determinism (testability of everything above)', () => {
  it('same seed, same time, same scene', () => {
    const params = buildParams(DEFAULT_SETTINGS);
    const sim: SimInput = { seed: 42, tapsMs: [1000] };
    for (const l of LESSONS) {
      const a = computeScene(l, params, 7321, sim, 7300);
      const b = computeScene(l, params, 7321, sim, 7300);
      expect(a).toEqual(b);
    }
  });
});
