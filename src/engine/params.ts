import type { ChildSettings, FieldBias } from '../lib/types';
import { BACKGROUNDS, TARGET_COLORS, SAFETY } from '../safety/constants';
import { clamp } from './kernel';

/**
 * Maps caregiver-facing settings (Section 5 of the requirements) onto concrete
 * engine parameters. This is the single funnel between "what a parent chose"
 * and "what the screen does", and it clamps everything against SAFETY here,
 * so no combination of settings can exceed the ceilings (SR-8).
 */
export interface EngineParams {
  color: string;
  bg: string;
  /** Target radius as a fraction of the smaller screen dimension (PR-6). */
  radius: number;
  /** Travel speed in screen-fractions per second (PR-2). Slow by design. */
  speed: number;
  movement: boolean;
  /** Base fade duration ms (PR-5); already >= SAFETY.MIN_FADE_MS. */
  fadeMs: number;
  /** Dwell/hold between events ms (PR-5 latency allowance). */
  holdMs: number;
  /** Peak target alpha (PR-7 brightness). */
  peakAlpha: number;
  /** Halo radius multiple; 0 disables glow entirely (PR-13). */
  glow: number;
  /** Pulse/twinkle modulation, pre-clamped. */
  modHz: number;
  modDepth: number;
  complexity: 1 | 2 | 3;
  fieldBias: FieldBias;
  biasStrength: 'gentle' | 'strong';
  /** Music tempo multiplier derived from pace. */
  tempoScale: number;
}

export function buildParams(s: ChildSettings): EngineParams {
  // pace 1 (slowest) .. 5 — multiplies durations; even the "fastest" stays gentle.
  const paceMult = [2.4, 1.9, 1.5, 1.2, 1.0][clamp(s.pace, 1, 5) - 1];

  return {
    color: TARGET_COLORS[s.targetColor] ?? TARGET_COLORS.red,
    bg: BACKGROUNDS[s.background] ?? BACKGROUNDS.black,
    radius: clamp(0.055 + 0.038 * (s.size - 1), 0.04, 0.24),
    speed: clamp(0.018 + 0.02 * (s.speed - 1), 0.01, 0.11),
    movement: s.movement,
    fadeMs: Math.max(1100 * paceMult, SAFETY.MIN_FADE_MS),
    holdMs: 2200 * paceMult,
    peakAlpha: [0.72, 0.86, 1.0][clamp(s.brightness, 1, 3) - 1],
    glow: [0, 0.6, 1.0, 1.4][clamp(s.glow, 0, 3)],
    modHz: clamp(0.14 / paceMult, 0.02, SAFETY.MAX_MOD_HZ),
    modDepth: clamp(0.05 + 0.01 * s.brightness, 0, SAFETY.MAX_MOD_DEPTH),
    complexity: s.complexity,
    fieldBias: s.fieldBias,
    biasStrength: s.biasStrength,
    tempoScale: clamp(1 / paceMult, 0.45, 1.0),
  };
}

/**
 * PR-4 — visual-field bias. Maps a unit point into the biased region of the
 * screen: "gentle" favours the region but still visits the rest; "strong"
 * keeps targets there almost always. Pure and testable.
 */
export function biasPoint(
  u: number,
  v: number,
  bias: FieldBias,
  strength: 'gentle' | 'strong',
): { x: number; y: number } {
  // Keep clear of edges so large targets stay fully on screen.
  const lo = 0.18;
  const hi = 0.82;
  const span = hi - lo;
  // Pull the unit coordinate toward an anchor deep inside the biased region.
  const k = strength === 'strong' ? 0.75 : 0.42;
  const pull = (unit: number, anchor: number) => unit + (anchor - unit) * k;
  let uu = u;
  let vv = v;
  if (bias === 'lower') vv = pull(v, 0.85);
  if (bias === 'upper') vv = pull(v, 0.15);
  if (bias === 'left') uu = pull(u, 0.15);
  if (bias === 'right') uu = pull(u, 0.85);
  return { x: clamp(lo + uu * span, 0.1, 0.9), y: clamp(lo + vv * span, 0.1, 0.9) };
}

/** The vertical band (for horizontal travel) or horizontal band respecting bias. */
export function biasBandY(bias: FieldBias, strength: 'gentle' | 'strong'): number {
  const k = strength === 'strong' ? 0.24 : 0.34;
  if (bias === 'lower') return 1 - k;
  if (bias === 'upper') return k;
  return 0.5;
}

export function biasBandX(bias: FieldBias, strength: 'gentle' | 'strong'): number {
  const k = strength === 'strong' ? 0.26 : 0.36;
  if (bias === 'left') return k;
  if (bias === 'right') return 1 - k;
  return 0.5;
}
