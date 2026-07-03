import { describe, expect, it } from 'vitest';
import type { Profile, SessionRecord } from '../src/lib/types';
import { emptyTally, MIN_SESSIONS, quadrantOf, regionInsight, type Quadrant } from '../src/lib/regions';
import { NON_DIAGNOSTIC_BANNED } from '../src/safety/validate';
import { DEFAULT_SETTINGS } from '../src/lib/store';

/**
 * PT-13 under SR-7: never from single sessions, never clinical language,
 * always tentative, always routed to the professional.
 */

function makeProfile(sessions: SessionRecord[], enabled = true): Profile {
  return {
    id: 'p1',
    nickname: 'Bean',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    ageBand: 'infant',
    settings: { ...DEFAULT_SETTINGS, fieldObservation: enabled },
    favorites: [],
    programs: [],
    photos: [],
    audio: [],
    sessions,
    lastReviewAt: new Date().toISOString(),
  };
}

function session(daysAgo: number, regions: SessionRecord['regions']): SessionRecord {
  return {
    id: `s${daysAgo}-${Math.floor(daysAgo * 7)}`,
    at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    lessonId: 'firefly',
    durationSec: 240,
    response: 'some',
    tags: [],
    regions,
  };
}

/** Sessions where the lower half was quiet and the upper half lively. */
function skewedSessions(n: number, spanDays: number): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (let i = 0; i < n; i++) {
    const t = emptyTally();
    t.ul = { s: 30, r: 4 };
    t.ur = { s: 30, r: 3 };
    t.ll = { s: 30, r: 0 };
    t.lr = { s: 30, r: 1 };
    out.push(session((i / Math.max(n - 1, 1)) * spanDays, t));
  }
  return out;
}

describe('field-pattern observation (PT-13 / SR-7)', () => {
  it('quadrant mapping is sane', () => {
    expect(quadrantOf(0.2, 0.2)).toBe('ul');
    expect(quadrantOf(0.8, 0.8)).toBe('lr');
  });

  it('silent with the setting off, even with rich data', () => {
    expect(regionInsight(makeProfile(skewedSessions(12, 20), false))).toBeNull();
  });

  it('silent below the session threshold — single sessions never speak (SR-7)', () => {
    expect(regionInsight(makeProfile(skewedSessions(MIN_SESSIONS - 1, 20)))).toBeNull();
  });

  it('silent below the time span threshold', () => {
    expect(regionInsight(makeProfile(skewedSessions(12, 5)))).toBeNull();
  });

  it('surfaces a skew descriptively, with hedging and professional routing', () => {
    const insight = regionInsight(makeProfile(skewedSessions(12, 21)));
    expect(insight).not.toBeNull();
    const text = insight!.lines.join(' ');
    expect(text).toMatch(/less often/);
    expect(text).toMatch(/tiredness, mood/i);
    expect(text).toMatch(/vision professional/i);
    expect(insight!.suggestion).toMatch(/experiment/i);
  });

  it('reports even spread without inventing a pattern', () => {
    const even: SessionRecord[] = [];
    for (let i = 0; i < 12; i++) {
      const t = emptyTally();
      for (const q of ['ul', 'ur', 'll', 'lr'] as Quadrant[]) t[q] = { s: 30, r: 2 };
      even.push(session((i / 11) * 21, t));
    }
    const insight = regionInsight(makeProfile(even));
    expect(insight!.lines[0]).toMatch(/spread fairly evenly/);
    expect(insight!.suggestion).toBeNull();
  });

  it('every sentence it can ever produce passes the non-diagnostic language guard (SR-7)', () => {
    for (const profile of [makeProfile(skewedSessions(12, 21)), makeProfile(evenSessions())]) {
      const insight = regionInsight(profile);
      if (!insight) continue;
      for (const line of [...insight.lines, insight.suggestion ?? '']) {
        expect(line, line).not.toMatch(NON_DIAGNOSTIC_BANNED);
      }
    }
  });

  it('ignores stale data — nothing older than three months is interpreted', () => {
    const old = skewedSessions(12, 21).map((s) => ({
      ...s,
      at: new Date(Date.parse(s.at) - 200 * 86400000).toISOString(),
    }));
    expect(regionInsight(makeProfile(old))).toBeNull();
  });
});

function evenSessions(): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (let i = 0; i < 12; i++) {
    const t = emptyTally();
    for (const q of ['ul', 'ur', 'll', 'lr'] as Quadrant[]) t[q] = { s: 30, r: 2 };
    out.push(session((i / 11) * 21, t));
  }
  return out;
}
