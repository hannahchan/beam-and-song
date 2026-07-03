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
    const sim: SimInput = { seed: 99, taps: [] };
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
    const taps: Array<{ t: number; x: number; y: number }> = [];
    for (let t = 0; t < 10_000; t += 125) taps.push({ t, x: -1, y: -1 });
    const sim: SimInput = { seed: 1, taps };
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

describe('reward intensity follows the scene (FR-12 softer mode)', () => {
  it('lower peak intensity dims blooms along with everything else', () => {
    const settings = { ...DEFAULT_SETTINGS, brightness: 3 as const, pace: 5 as const };
    const bright = buildParams(settings);
    const soft = { ...bright, peakAlpha: bright.peakAlpha * 0.55 };
    const tapAt = bright.fadeMs + 200; // after entry, so the response is undamped
    const sampleAt = tapAt + 900; // mid-bloom
    const sim: SimInput = { seed: 2, taps: [{ t: tapAt, x: -1, y: -1 }] };
    const bloomOf = (p: typeof bright) =>
      computeScene(spec('magic-touch'), p, sampleAt, sim).items.find((i) => i.shape === 'bloom');
    const a = bloomOf(bright);
    const b = bloomOf(soft);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(b!.alpha).toBeLessThan(a!.alpha * 0.7);
  });
});

describe('movement setting (PR-2)', () => {
  it('movement off keeps the drifting light perfectly still', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, movement: false });
    const sim: SimInput = { seed: 5, taps: [] };
    const a = computeScene(spec('drifting-light'), params, 5000, sim);
    const b = computeScene(spec('drifting-light'), params, 25000, sim);
    expect(a.items[0].x).toBeCloseTo(b.items[0].x, 5);
    expect(a.items[0].y).toBeCloseTo(b.items[0].y, 5);
  });

  it('movement on actually travels', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, movement: true, speed: 3 });
    const sim: SimInput = { seed: 5, taps: [] };
    const xs = new Set<number>();
    for (let t = 2000; t < 20000; t += 2000) {
      xs.add(Math.round(computeScene(spec('drifting-light'), params, t, sim).items[0]?.x * 100));
    }
    expect(xs.size).toBeGreaterThan(3);
  });
});

describe('find/search lessons (L3–L4, CR-8)', () => {
  const params = () => buildParams({ ...DEFAULT_SETTINGS, complexity: 2 });

  function targetOf(scene: ReturnType<typeof computeScene>) {
    // The target is the star/photo item (distractors are dim orbs).
    return scene.items.find((i) => i.shape === 'star' || i.shape === 'photo')!;
  }

  it('a tap near the target answers with a chime; a distant tap does not', () => {
    const p = params();
    const probe = computeScene(spec('find-the-star'), p, 4000, { seed: 3, taps: [] });
    const target = targetOf(probe);
    const hit = computeScene(spec('find-the-star'), p, 4100, { seed: 3, taps: [{ t: 4050, x: target.x, y: target.y }] }, 4000);
    expect(hit.cues).toContain('chime');
    const missTaps = [{ t: 4050, x: target.x > 0.5 ? 0.05 : 0.95, y: target.y > 0.5 ? 0.05 : 0.95 }];
    const miss = computeScene(spec('find-the-star'), p, 4100, { seed: 3, taps: missTaps }, 4000);
    expect(miss.cues).not.toContain('chime');
  });

  it('a switch press (no pointer) always counts as a hit (AR-8)', () => {
    const p = params();
    const scene = computeScene(spec('find-the-star'), p, 4100, { seed: 3, taps: [{ t: 4050, x: -1, y: -1 }] }, 4000);
    expect(scene.cues).toContain('chime');
  });

  it('company scales with the complexity setting, and search adds more', () => {
    const count = (id: string, complexity: 1 | 2 | 3) => {
      const p = buildParams({ ...DEFAULT_SETTINGS, complexity });
      return computeScene(spec(id), p, 5000, { seed: 3, taps: [] }).items.length;
    };
    expect(count('find-the-star', 3)).toBeGreaterThan(count('find-the-star', 1));
    expect(count('hidden-among-many', 2)).toBeGreaterThan(count('find-the-star', 2));
  });

  it('near-and-far cycles through sizes', () => {
    const p = buildParams(DEFAULT_SETTINGS);
    const sizes = new Set<number>();
    const fade = p.fadeMs * 1.35; // larger targets arrive more slowly (see nearFar)
    const cycle = 2 * fade + p.holdMs * 1.6 + p.holdMs * 0.6;
    for (let i = 0; i < 4; i++) {
      const scene = computeScene(spec('near-and-far'), p, i * cycle + fade + 400, { seed: 5, taps: [] });
      if (scene.items[0]) sizes.add(Math.round(scene.items[0].r * 1000));
    }
    expect(sizes.size).toBeGreaterThanOrEqual(3);
  });
});

describe('listening lessons (CR-5)', () => {
  it("Where's the Song alternates sides and answers taps from the calling side", () => {
    const p = buildParams(DEFAULT_SETTINGS);
    const gap = p.holdMs * 0.9;
    const call = p.holdMs * 2.2;
    const cycle = gap + call;
    const mid = (i: number) => i * cycle + gap + call / 2;
    const sceneL = computeScene(spec('wheres-the-song'), p, mid(0), { seed: 1, taps: [] });
    const sceneR = computeScene(spec('wheres-the-song'), p, mid(1), { seed: 1, taps: [] });
    expect(sceneL.pan).toBeLessThan(-0.5);
    expect(sceneR.pan).toBeGreaterThan(0.5);

    // A tap during the call answers; a tap in the quiet gap rests.
    const tapDuringCall = computeScene(
      spec('wheres-the-song'), p, mid(0) + 60, { seed: 1, taps: [{ t: mid(0) + 30, x: -1, y: -1 }] }, mid(0),
    );
    expect(tapDuringCall.cues).toContain('chime');
    const tapInGap = computeScene(
      spec('wheres-the-song'), p, gap / 2 + 60, { seed: 1, taps: [{ t: gap / 2, x: -1, y: -1 }] }, gap / 2 - 30,
    );
    expect(tapInGap.cues).not.toContain('chime');
  });

  it('Drum and Tune and Big Sound emit their contrasting cues in turn', () => {
    const p = buildParams(DEFAULT_SETTINGS);
    const collect = (id: string, seconds: number) => {
      const cues: string[] = [];
      for (let t = 0; t < seconds * 1000; t += 250) {
        cues.push(...computeScene(spec(id), p, t, { seed: 1, taps: [] }, t - 250).cues);
      }
      return cues;
    };
    const rhythm = collect('drum-and-tune', 30);
    expect(rhythm).toContain('beat');
    expect(rhythm).toContain('phrase');
    const loud = collect('big-sound-little-sound', 30);
    expect(loud).toContain('toneSoft');
    expect(loud).toContain('toneFull');
  });
});

describe('measured photo luminance feeds the safety model (CR-3/SR-8)', () => {
  it('a dark measured photo contributes less than an unmeasured (worst-case) one', async () => {
    const { sceneLuminance } = await import('../src/safety/luminance');
    const params = buildParams({ ...DEFAULT_SETTINGS, brightness: 3, size: 5 });
    const photoSpec = spec('familiar-photo');
    const t = 5000; // mid-hold, fully faded in
    const dark = computeScene(photoSpec, params, t, { seed: 1, taps: [], photos: [{ dataUrl: 'x', lum: 0.05 }] });
    const worst = computeScene(photoSpec, params, t, { seed: 1, taps: [], photos: [{ dataUrl: 'x' }] });
    expect(sceneLuminance(dark)).toBeLessThan(sceneLuminance(worst) * 0.4);
  });

  it('multiple photos cycle across appearances (PR-9)', () => {
    const params = buildParams(DEFAULT_SETTINGS);
    const photos = [
      { dataUrl: 'a', lum: 0.2 },
      { dataUrl: 'b', lum: 0.3 },
    ];
    const seen = new Set<string>();
    for (let t = 3000; t < 120_000; t += 4000) {
      const scene = computeScene(spec('familiar-photo'), params, t, { seed: 1, taps: [], photos });
      const url = scene.items.find((i) => i.shape === 'photo')?.photoDataUrl;
      if (url) seen.add(url);
    }
    expect(seen).toEqual(new Set(['a', 'b']));
  });
});

describe('determinism (testability of everything above)', () => {
  it('same seed, same time, same scene', () => {
    const params = buildParams(DEFAULT_SETTINGS);
    const sim: SimInput = { seed: 42, taps: [{ t: 1000, x: -1, y: -1 }] };
    for (const l of LESSONS) {
      const a = computeScene(l, params, 7321, sim, 7300);
      const b = computeScene(l, params, 7321, sim, 7300);
      expect(a).toEqual(b);
    }
  });
});
