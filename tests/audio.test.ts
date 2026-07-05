import { describe, expect, it } from 'vitest';
import { spatialParams } from '../src/engine/audio';

/**
 * FR-10, the pure half of sound-follows-target. Plain stereo by design:
 * HRTF is a headphone technique and the lessons' hardware is speakers
 * (see the note on spatialParams in audio.ts).
 */
describe('spatial audio mapping', () => {
  it('pan passes through monotonically and clamps to the stereo range', () => {
    expect(spatialParams(-1).pan).toBeLessThan(spatialParams(0).pan);
    expect(spatialParams(0).pan).toBeLessThan(spatialParams(1).pan);
    expect(spatialParams(-5).pan).toBe(-1);
    expect(spatialParams(5).pan).toBe(1);
    expect(spatialParams(0).pan).toBe(0);
    // Full pan reaches the panner at full strength, nothing softens the side.
    expect(spatialParams(0.9).pan).toBeCloseTo(0.9);
  });

  it('higher on screen means audibly brighter, never muffled into silence', () => {
    const top = spatialParams(0, 0);
    const bottom = spatialParams(0, 1);
    expect(top.filterHz).toBeGreaterThan(bottom.filterHz);
    expect(bottom.filterHz).toBeGreaterThanOrEqual(1400); // never muffled into silence
  });
});
