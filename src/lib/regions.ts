import type { Profile, SessionRecord } from './types';

/**
 * PT-13 — optional field-pattern observation, under hard SR-7 guardrails.
 *
 * What this is: a tuning-and-conversation aid. Sessions quietly count where
 * on screen the target sat (quadrants) and where marked responses landed.
 * After enough sessions across enough time, it offers a *descriptive,
 * tentative* sentence and routes interpretation to the professional.
 *
 * What this is never: an assessment, a map of vision, a score, or anything
 * with clinical vocabulary. The templates below are covered by the
 * NON_DIAGNOSTIC_BANNED language test, and nothing surfaces from single
 * sessions (fatigue, mood, and latency dominate those — PT-8).
 */

export type Quadrant = 'ul' | 'ur' | 'll' | 'lr';
export type RegionTally = Record<Quadrant, { s: number; r: number }>;

export const MIN_SESSIONS = 8;
export const MIN_SPAN_DAYS = 14;
export const MIN_EXPOSURE_SEC_PER_QUADRANT = 90;
/** Only speak up when the quietest quadrant is well below the liveliest. */
const RATIO_THRESHOLD = 0.45;

export function emptyTally(): RegionTally {
  return { ul: { s: 0, r: 0 }, ur: { s: 0, r: 0 }, ll: { s: 0, r: 0 }, lr: { s: 0, r: 0 } };
}

export function quadrantOf(x: number, y: number): Quadrant {
  return y < 0.5 ? (x < 0.5 ? 'ul' : 'ur') : x < 0.5 ? 'll' : 'lr';
}

const QUADRANT_WORDS: Record<Quadrant, string> = {
  ul: 'upper-left',
  ur: 'upper-right',
  ll: 'lower-left',
  lr: 'lower-right',
};

export interface RegionInsight {
  /** Descriptive, tentative, session-bound (SR-7). */
  lines: string[];
  /** An experiment to try, phrased as exactly that — or null. */
  suggestion: string | null;
  sessionsUsed: number;
}

/** Sessions that can inform this at all: observation was on and something was marked. */
function qualifying(profile: Profile): SessionRecord[] {
  return profile.sessions.filter((s) => {
    if (!s.regions) return false;
    const totals = Object.values(s.regions);
    return totals.some((q) => q.r > 0) && totals.some((q) => q.s > 5);
  });
}

export function regionInsight(profile: Profile, now = Date.now()): RegionInsight | null {
  if (!profile.settings.fieldObservation) return null;
  const sessions = qualifying(profile);
  if (sessions.length < MIN_SESSIONS) return null;
  const times = sessions.map((s) => Date.parse(s.at));
  const spanDays = (Math.max(...times) - Math.min(...times)) / 86400000;
  if (spanDays < MIN_SPAN_DAYS || now - Math.max(...times) > 90 * 86400000) return null;

  const tally = emptyTally();
  for (const s of sessions) {
    for (const q of Object.keys(tally) as Quadrant[]) {
      tally[q].s += s.regions?.[q]?.s ?? 0;
      tally[q].r += s.regions?.[q]?.r ?? 0;
    }
  }

  const quads = (Object.keys(tally) as Quadrant[]).filter((q) => tally[q].s >= MIN_EXPOSURE_SEC_PER_QUADRANT);
  if (quads.length < 3) return null; // targets have not visited enough of the screen

  const density = (q: Quadrant) => tally[q].r / Math.max(tally[q].s, 1);
  const sorted = [...quads].sort((a, b) => density(a) - density(b));
  const quietest = sorted[0];
  const liveliest = sorted[sorted.length - 1];

  const lines: string[] = [];
  let suggestion: string | null = null;

  if (density(liveliest) > 0 && density(quietest) / density(liveliest) < RATIO_THRESHOLD) {
    lines.push(
      `Across ${sessions.length} sessions over these weeks, the moments you marked came less often while the target sat toward the ${QUADRANT_WORDS[quietest]} of the screen, and most often toward the ${QUADRANT_WORDS[liveliest]}.`,
    );
    const side =
      quietest === 'll' || quietest === 'lr'
        ? liveliest === 'ul' || liveliest === 'ur'
          ? 'upper'
          : null
        : liveliest === 'll' || liveliest === 'lr'
          ? 'lower'
          : null;
    const lateral = quietest.endsWith('l') && liveliest.endsWith('r') ? 'right' : quietest.endsWith('r') && liveliest.endsWith('l') ? 'left' : null;
    const favour = side ?? lateral;
    if (favour) {
      suggestion = `If you'd like an experiment to discuss with their vision professional: try setting "Where targets appear" to favour the ${favour} for a while, and watch what changes.`;
    }
  } else {
    lines.push(
      `Across ${sessions.length} sessions over these weeks, the moments you marked were spread fairly evenly around the screen — no corner stands out.`,
    );
  }

  lines.push(
    'This only describes these sessions — tiredness, mood, and the long pauses of CVI shape every one of them, and days vary a lot.',
    'It is a conversation starter for their vision professional, never a finding about vision itself.',
  );

  return { lines, suggestion, sessionsUsed: sessions.length };
}
