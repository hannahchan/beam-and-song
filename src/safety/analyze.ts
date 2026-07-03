import { SAFETY } from './constants';

/**
 * Flash-safety analyzer (SR-1, SR-3, SR-5, SR-8).
 *
 * Takes a sampled timeline of screen luminance (and saturated-red coverage)
 * and measures it the way a photosensitivity check would: peak level, largest
 * swing in any half-second, and opposing luminance transitions ("flash pairs")
 * in any one-second window. tests/safety.test.ts runs this over a headless
 * simulation of every lesson at every extreme setting.
 */

export interface AnalysisResult {
  maxLum: number;
  maxDeltaPer500ms: number;
  maxFlashPairsPerSec: number;
  maxRedFlashPairsPerSec: number;
}

interface Transition {
  atIndex: number;
  delta: number; // signed swing between consecutive local extrema
}

/** Find swings between local extrema that exceed a threshold. */
function transitions(series: readonly number[], threshold: number, darkFloor: number): Transition[] {
  const out: Transition[] = [];
  if (series.length < 2) return out;
  let anchor = series[0];
  let anchorIdx = 0;
  let dir = 0;
  for (let i = 1; i < series.length; i++) {
    const d = series[i] - series[i - 1];
    const newDir = d > 1e-9 ? 1 : d < -1e-9 ? -1 : dir;
    if (newDir !== 0 && dir !== 0 && newDir !== dir) {
      const swing = series[i - 1] - anchor;
      const darker = Math.min(series[i - 1], anchor);
      if (Math.abs(swing) >= threshold && darker < darkFloor) {
        out.push({ atIndex: i - 1, delta: swing });
      }
      anchor = series[i - 1];
      anchorIdx = i - 1;
    }
    if (newDir !== 0) dir = newDir;
  }
  const swing = series[series.length - 1] - anchor;
  if (Math.abs(swing) >= threshold && Math.min(series[series.length - 1], series[anchorIdx]) < darkFloor) {
    out.push({ atIndex: series.length - 1, delta: swing });
  }
  return out;
}

/** Count opposing transition pairs inside any sliding 1 s window. */
function maxPairsPerSecond(trans: Transition[], fps: number): number {
  let worst = 0;
  for (let i = 0; i < trans.length; i++) {
    let pairs = 0;
    let lastSign = Math.sign(trans[i].delta);
    for (let j = i + 1; j < trans.length; j++) {
      if (trans[j].atIndex - trans[i].atIndex > fps) break;
      const sign = Math.sign(trans[j].delta);
      if (sign !== 0 && sign !== lastSign) {
        pairs++;
        lastSign = sign;
      }
    }
    worst = Math.max(worst, pairs);
  }
  return worst;
}

export function analyzeLuminance(
  lumSeries: readonly number[],
  redSeries: readonly number[],
  fps: number,
): AnalysisResult {
  let maxLum = 0;
  for (const v of lumSeries) maxLum = Math.max(maxLum, v);

  // Largest swing within any 0.5 s window.
  const half = Math.max(1, Math.round(fps / 2));
  let maxDelta = 0;
  for (let i = 0; i < lumSeries.length; i++) {
    let lo = lumSeries[i];
    let hi = lumSeries[i];
    for (let j = i; j < Math.min(lumSeries.length, i + half); j++) {
      lo = Math.min(lo, lumSeries[j]);
      hi = Math.max(hi, lumSeries[j]);
    }
    maxDelta = Math.max(maxDelta, hi - lo);
  }

  const lumTrans = transitions(lumSeries, SAFETY.FLASH_DELTA, 0.8);
  const redTrans = transitions(redSeries, SAFETY.RED_AREA_DELTA, Infinity);

  return {
    maxLum,
    maxDeltaPer500ms: maxDelta,
    maxFlashPairsPerSec: maxPairsPerSecond(lumTrans, fps),
    maxRedFlashPairsPerSec: maxPairsPerSecond(redTrans, fps),
  };
}

/** Throws with a readable message if a timeline violates any hard limit. */
export function assertTimelineSafe(result: AnalysisResult, label: string): void {
  const fail = (msg: string) => {
    throw new Error(`SAFETY VIOLATION in ${label}: ${msg} (${JSON.stringify(result)})`);
  };
  if (result.maxLum > SAFETY.MAX_SCREEN_LUM) fail(`screen luminance ${result.maxLum.toFixed(3)} exceeds ${SAFETY.MAX_SCREEN_LUM}`);
  if (result.maxDeltaPer500ms > SAFETY.MAX_LUM_DELTA_PER_500MS)
    fail(`luminance swing ${result.maxDeltaPer500ms.toFixed(3)} in 500ms exceeds ${SAFETY.MAX_LUM_DELTA_PER_500MS}`);
  if (result.maxFlashPairsPerSec > SAFETY.MAX_FLASH_PAIRS_PER_SEC)
    fail(`${result.maxFlashPairsPerSec} flash pairs/sec exceeds ${SAFETY.MAX_FLASH_PAIRS_PER_SEC}`);
  if (result.maxRedFlashPairsPerSec > 0) fail(`saturated-red flashing detected`);
}
