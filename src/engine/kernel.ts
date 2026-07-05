import { SAFETY } from '../safety/constants';

/**
 * The animation kernel. Every lesson behavior builds its motion from these
 * primitives, and the primitives themselves clamp to the safety ceilings,
 * so a scene cannot express a hazardous flash even if a spec or setting is
 * wrong (SR-1, SR-2, SR-8 "enforced, not just intended").
 */

/** Smooth ease for movement, no hard starts or stops. */
export function easeInOutSine(u: number): number {
  const t = clamp01(u);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

/** Smoothstep for fades. */
export function smooth(u: number): number {
  const t = clamp01(u);
  return t * t * (3 - 2 * t);
}

export function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function mix(a: number, b: number, u: number): number {
  return a + (b - a) * u;
}

/**
 * Periodic modulation, frequency- and depth-clamped (SR-1).
 * Returns a value in [-depth, +depth].
 */
export function safeMod(tSec: number, hz: number, depth: number, phase = 0): number {
  const f = clamp(hz, 0, SAFETY.MAX_MOD_HZ);
  const d = clamp(depth, 0, SAFETY.MAX_MOD_DEPTH);
  return d * Math.sin(2 * Math.PI * f * tSec + phase);
}

/**
 * Trapezoid envelope with enforced minimum fade times (SR-2):
 * 0 before start, fades in over fadeIn ms, holds, fades out over fadeOut ms.
 */
export function fadeEnvelope(
  tMs: number,
  startMs: number,
  fadeInMs: number,
  holdMs: number,
  fadeOutMs: number,
): number {
  const fi = Math.max(fadeInMs, SAFETY.MIN_FADE_MS);
  const fo = Math.max(fadeOutMs, SAFETY.MIN_FADE_MS);
  const t = tMs - startMs;
  if (t <= 0) return 0;
  if (t < fi) return smooth(t / fi);
  if (t < fi + holdMs) return 1;
  if (t < fi + holdMs + fo) return 1 - smooth((t - fi - holdMs) / fo);
  return 0;
}

/** Total length of one fadeEnvelope cycle (with fades clamped the same way). */
export function envelopeLength(fadeInMs: number, holdMs: number, fadeOutMs: number): number {
  return Math.max(fadeInMs, SAFETY.MIN_FADE_MS) + holdMs + Math.max(fadeOutMs, SAFETY.MIN_FADE_MS);
}

/**
 * Filter raw input timestamps so rewards can never retrigger faster than the
 * safety cooldown, no matter how fast taps or switch presses arrive (SR-6).
 */
export function effectiveTaps(tapTimesMs: readonly number[], cooldownMs?: number): number[] {
  const cd = Math.max(cooldownMs ?? 0, SAFETY.MIN_REWARD_COOLDOWN_MS);
  const out: number[] = [];
  let last = -Infinity;
  for (const t of [...tapTimesMs].sort((a, b) => a - b)) {
    if (t - last >= cd) {
      out.push(t);
      last = t;
    }
  }
  return out;
}

/** Positional variant for find/search lessons, same cooldown guarantee. */
export function effectiveTapEvents<T extends { t: number }>(taps: readonly T[], cooldownMs?: number): T[] {
  const cd = Math.max(cooldownMs ?? 0, SAFETY.MIN_REWARD_COOLDOWN_MS);
  const out: T[] = [];
  let last = -Infinity;
  for (const ev of [...taps].sort((a, b) => a.t - b.t)) {
    if (ev.t - last >= cd) {
      out.push(ev);
      last = ev.t;
    }
  }
  return out;
}

/** A pressed interval: touch-down to touch-up, or a held switch. An end past "now" means still held. */
export interface HoldSpan {
  start: number;
  end: number;
}

/** Merge unordered/overlapping hold spans (multi-touch) into a clean timeline, clipped to [0, nowMs]. */
export function effectiveHolds(holds: readonly HoldSpan[], nowMs: number): HoldSpan[] {
  const spans = holds
    .map((h) => ({ start: Math.max(0, h.start), end: clamp(h.end, Math.max(0, h.start), nowMs) }))
    .filter((h) => h.end > h.start)
    .sort((a, b) => a.start - b.start);
  const merged: HoldSpan[] = [];
  for (const s of spans) {
    const prev = merged[merged.length - 1];
    if (prev && s.start <= prev.end) prev.end = Math.max(prev.end, s.end);
    else merged.push({ ...s });
  }
  return merged;
}

/**
 * Slew-limited sustain envelope for hold-to-keep-it-going lessons (SR-1/SR-3
 * by construction): the value can only climb at 1/riseMs and settle at
 * 1/fallMs, both floored at the minimum fade, no matter how fast presses
 * arrive. Mashing therefore wiggles it gently around a level; it can never
 * flicker. Pure function of the full hold history, so the safety suite can
 * measure any press pattern it likes.
 */
export function holdEnvelope(
  tMs: number,
  holds: readonly HoldSpan[],
  riseMs: number,
  fallMs: number,
): number {
  const rise = Math.max(riseMs, SAFETY.MIN_FADE_MS);
  const fall = Math.max(fallMs, SAFETY.MIN_FADE_MS);
  let v = 0;
  let cursor = 0;
  for (const s of effectiveHolds(holds, tMs)) {
    if (s.start >= tMs) break;
    v = Math.max(0, v - (s.start - cursor) / fall); // settle through the gap
    const activeEnd = Math.min(s.end, tMs);
    v = Math.min(1, v + (activeEnd - s.start) / rise); // climb while held
    cursor = activeEnd;
  }
  return clamp01(v - Math.max(0, tMs - cursor) / fall);
}

/** Deterministic PRNG (mulberry32) so scenes are reproducible in tests. */
export function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}
