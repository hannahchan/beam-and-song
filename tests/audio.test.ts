import { describe, expect, it } from 'vitest';
import { spatialParams } from '../src/engine/audio';

/** FR-10 — the pure half of sound-follows-target. */
describe('spatial audio mapping', () => {
  it('pan maps monotonically left to right and clamps', () => {
    expect(spatialParams(-1).x).toBeLessThan(spatialParams(0).x);
    expect(spatialParams(0).x).toBeLessThan(spatialParams(1).x);
    expect(spatialParams(-5).x).toBe(spatialParams(-1).x);
    expect(spatialParams(5).x).toBe(spatialParams(1).x);
    expect(spatialParams(0).x).toBe(0);
  });

  it('higher on screen means physically higher and audibly brighter', () => {
    const top = spatialParams(0, 0);
    const bottom = spatialParams(0, 1);
    expect(top.y).toBeGreaterThan(bottom.y);
    expect(top.filterHz).toBeGreaterThan(bottom.filterHz);
    expect(bottom.filterHz).toBeGreaterThanOrEqual(1400); // never muffled into silence
  });

  it('the source always sits in front of the listener', () => {
    for (const pan of [-1, 0, 1]) {
      expect(spatialParams(pan).z).toBeLessThan(0);
    }
  });
});
