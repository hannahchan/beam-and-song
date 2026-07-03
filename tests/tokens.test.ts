import { describe, expect, it } from 'vitest';
import { CONTRAST_PAIRS, tokens } from '../src/lib/tokens';
import { contrastRatio } from '../src/safety/luminance';

/**
 * AR-4 / AR-6 / TR-10 — contrast is verified from the single source of truth.
 * (axe's contrast rule cannot run in jsdom, so we check the palette directly.)
 */
describe('grown-up palette meets WCAG 2.1 AA contrast', () => {
  for (const [fg, bg] of CONTRAST_PAIRS) {
    it(`${fg} on ${bg} ≥ 4.5:1`, () => {
      const ratio = contrastRatio(tokens[fg], tokens[bg]);
      expect(ratio, `${tokens[fg]} on ${tokens[bg]} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(4.5);
    });
  }
});
