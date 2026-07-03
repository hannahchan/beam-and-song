import { describe, expect, it } from 'vitest';
import { CHOICE_BEHAVIORS, LessonScanController, LESSON_SCAN } from '../src/ui/lessonScan';
import type { SceneItem } from '../src/lib/types';

/** AR-8 — the in-lesson choice ring: calm by construction, honest stepping. */

const item = (x: number, y: number, over: Partial<SceneItem> = {}): SceneItem => ({
  shape: 'orb',
  x,
  y,
  r: 0.08,
  color: '#e8262d',
  alpha: 0.5,
  glow: 0,
  ...over,
});

const SCENE = [item(0.2, 0.3), item(0.5, 0.6), item(0.8, 0.4)];

describe('in-lesson choice scanning', () => {
  it('covers exactly the choice lessons', () => {
    expect([...CHOICE_BEHAVIORS].sort()).toEqual(['amongMoving', 'findAmong', 'searchClutter']);
  });

  it('the ring can never blink or jump: constant target alpha, gliding position', () => {
    expect(LESSON_SCAN.GLIDE_MS).toBeGreaterThanOrEqual(400);
    expect(LESSON_SCAN.RING_ALPHA).toBeLessThanOrEqual(0.8);
    expect(LESSON_SCAN.STROKE_FRAC).toBeLessThanOrEqual(0.015);
  });

  it('skips blooms, dust, and near-invisible items', () => {
    const scan = new LessonScanController();
    const items = [
      item(0.5, 0.5),
      item(0.5, 0.5, { shape: 'bloom' }),
      item(0.1, 0.1, { r: 0.006 }), // backdrop dust
      item(0.9, 0.9, { alpha: 0.02 }), // faded out
    ];
    expect(scan.candidates(items)).toHaveLength(1);
  });

  it('auto mode advances only after the dwell elapses', () => {
    const scan = new LessonScanController();
    scan.update(SCENE, 0, 16, 'auto', 1500);
    expect(scan.selection()).toEqual({ x: 0.2, y: 0.3 });
    scan.update(SCENE, 1400, 16, 'auto', 1500);
    expect(scan.selection()).toEqual({ x: 0.2, y: 0.3 }); // not yet
    scan.update(SCENE, 1600, 16, 'auto', 1500);
    expect(scan.selection()).toEqual({ x: 0.5, y: 0.6 }); // stepped once
  });

  it('step mode wraps around the candidates', () => {
    const scan = new LessonScanController();
    scan.update(SCENE, 0, 16, 'step', 1500);
    scan.step(0);
    scan.step(0);
    scan.step(0); // three steps from index 0 wraps back to the first
    scan.update(SCENE, 100, 16, 'step', 1500);
    expect(scan.selection()).toEqual({ x: 0.2, y: 0.3 });
  });

  it('the ring glides toward a new highlight instead of teleporting', () => {
    const scan = new LessonScanController();
    let ring = scan.update(SCENE, 0, 16, 'step', 1500);
    // settle the fade-in
    for (let t = 16; t < 2000; t += 16) ring = scan.update(SCENE, t, 16, 'step', 1500);
    const beforeX = ring.x;
    scan.step(2000);
    ring = scan.update(SCENE, 2016, 16, 'step', 1500);
    // one frame later it has moved toward, but not reached, the next item
    expect(ring.x).toBeGreaterThan(beforeX);
    expect(ring.x).toBeLessThan(0.5);
  });

  it('fades out gracefully when candidates vanish between arrangements', () => {
    const scan = new LessonScanController();
    for (let t = 0; t < 2000; t += 16) scan.update(SCENE, t, 16, 'auto', 1500);
    let ring = scan.update([], 2016, 16, 'auto', 1500);
    const a1 = ring.alpha;
    ring = scan.update([], 2032, 16, 'auto', 1500);
    expect(ring.alpha).toBeLessThan(a1);
    expect(scan.selection()).toBeNull();
  });
});
