import { describe, expect, it } from 'vitest';
import { LESSONS } from '../src/lessons/specs';
import { adaptCopy, resolveLesson } from '../src/lessons/bands';
import { validateAll } from '../src/safety/validate';
import { buildParams } from '../src/engine/params';
import { computeScene } from '../src/engine/scenes';
import { sceneLuminance, saturatedRedArea } from '../src/safety/luminance';
import { analyzeLuminance, assertTimelineSafe } from '../src/safety/analyze';
import { DEFAULT_SETTINGS } from '../src/lib/store';
import { MELODIES } from '../src/engine/melodies';

/**
 * CR-9 / CR-10, phase and age are independent axes, and the older bands
 * must never be served babyish content. These tests make "serve every age
 * with dignity" a build-breaking guarantee, not a style hope.
 */

describe('age bands', () => {
  it('teen-resolved lessons contain no babyish language, imagery, or nursery tunes', () => {
    const bannedCopy = /\bbaby\b|\bbabies\b|nursery|lullab|duck|cartoon|cute little|peekaboo|\bboo\b/i;
    const nurseryMelodies = new Set(['twinkle', 'frere', 'mary', 'row', 'brahms']);
    for (const base of LESSONS) {
      const teen = resolveLesson(base, 'teen');
      const copy = `${teen.title} ${teen.theme} ${teen.goal} ${teen.watchFor} ${teen.bridge ?? ''} ${teen.skill}`;
      expect(copy, `${base.id} teen copy`).not.toMatch(bannedCopy);
      expect(teen.shape, `${base.id} teen shape`).not.toBe('duck');
      expect(nurseryMelodies.has(teen.melody), `${base.id} teen melody "${teen.melody}"`).toBe(false);
    }
  });

  it('the band skin reaches the canvas: teen scenes never draw a duck', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, movement: true });
    for (const id of ['little-duck', 'quiet-scene']) {
      const teen = resolveLesson(LESSONS.find((l) => l.id === id)!, 'teen');
      const sim = { seed: 5, taps: [] as { t: number; x: number; y: number }[] };
      for (let t = 0; t <= 60_000; t += 250) {
        const scene = computeScene(teen, params, t, sim, t - 250);
        for (const item of scene.items) {
          expect(item.shape, `${id} at ${t}ms`).not.toBe('duck');
        }
      }
    }
  });

  it('child-band copy swaps "your baby" for "your child" mechanically', () => {
    expect(adaptCopy('Watch how your baby settles; babies vary.', 'child')).toBe(
      'Watch how your child settles; children vary.',
    );
    const child = resolveLesson(LESSONS.find((l) => l.id === 'gentle-glow')!, 'child');
    expect(child.goal).not.toMatch(/baby/i);
  });

  it('the middle band never says "baby" and its own melodies stay gentle', () => {
    for (const base of LESSONS) {
      const child = resolveLesson(base, 'child');
      const copy = `${child.title} ${child.goal} ${child.watchFor} ${child.bridge ?? ''}`;
      expect(copy, `${base.id} child copy`).not.toMatch(/\bbaby\b|\bbabies\b/i);
    }
    for (const id of ['lanternWaltz', 'meadow'] as const) {
      expect(MELODIES[id]).toBeDefined();
      expect(MELODIES[id].bpm).toBeLessThanOrEqual(78);
    }
    // The middle band has its own musical identity where the infant band
    // leans most heavily on lullaby (the opening lesson).
    const glow = resolveLesson(LESSONS.find((l) => l.id === 'gentle-glow')!, 'child');
    expect(glow.melody).not.toBe('brahms');
  });

  it('resolution preserves behavior, level, and interactivity, age never changes the practice', () => {
    for (const base of LESSONS) {
      for (const band of ['child', 'teen'] as const) {
        const r = resolveLesson(base, band);
        expect(r.behavior).toBe(base.behavior);
        expect(r.level).toBe(base.level);
        expect(r.interactive).toBe(base.interactive);
        expect(r.id).toBe(base.id);
      }
    }
  });

  it('resolved specs for every band still pass spec validation', () => {
    for (const band of ['infant', 'child', 'teen'] as const) {
      expect(validateAll(LESSONS.map((l) => resolveLesson(l, band)))).toEqual([]);
    }
  });

  it('teen melodies exist and stay gentle', () => {
    for (const id of ['ember', 'nightSky', 'tideGlass'] as const) {
      expect(MELODIES[id]).toBeDefined();
      expect(MELODIES[id].bpm).toBeLessThanOrEqual(60);
    }
  });

  it('teen-resolved lessons stay inside the safety limits too (SR-8)', () => {
    const params = buildParams({ ...DEFAULT_SETTINGS, brightness: 3, size: 5, glow: 3, targetColor: 'white' });
    const FPS = 60;
    for (const base of LESSONS) {
      const teen = resolveLesson(base, 'teen');
      const lum: number[] = [];
      const red: number[] = [];
      const sim = { seed: 7, taps: [], photos: [{ dataUrl: 'x' }] };
      for (let i = 0; i < 15 * FPS; i++) {
        const scene = computeScene(teen, params, (i * 1000) / FPS, sim, ((i - 1) * 1000) / FPS);
        lum.push(sceneLuminance(scene));
        red.push(saturatedRedArea(scene));
      }
      assertTimelineSafe(analyzeLuminance(lum, red, FPS), `${teen.id} (teen)`);
    }
  });
});
