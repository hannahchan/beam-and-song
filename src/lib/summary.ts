import type { Profile, SessionRecord } from './types';
import { getLesson } from '../lessons/specs';
import { regionInsight } from './regions';

/**
 * PT-7 — turn raw observations into something a caregiver (and their vision
 * professional) can actually read. Descriptive and tentative by design: counts and phrasing,
 * never scores, grades, or clinical language (SR-7 spirit).
 */

export interface Summary {
  windowDays: number;
  total: number;
  withResponse: number; // clear or a little
  clear: number;
  some: number;
  none: number;
  unsure: number;
  unrecorded: number;
  taggedHardDays: number;
  hardDayLine: string | null;
  topLesson: { title: string; count: number } | null;
  weeks: Array<{ label: string; total: number; responded: number }>;
}

const HARD_TAGS = new Set(['tired', 'unwell', 'post-seizure', 'new medicine']);

export function inWindow(s: SessionRecord, days: number, now = Date.now()): boolean {
  return now - Date.parse(s.at) <= days * 86400000;
}

export function summarize(profile: Profile, days = 28, now = Date.now()): Summary {
  const sessions = profile.sessions.filter((s) => inWindow(s, days, now));
  const count = (r: SessionRecord['response']) => sessions.filter((s) => s.response === r).length;

  const byLesson = new Map<string, number>();
  for (const s of sessions) byLesson.set(s.lessonId, (byLesson.get(s.lessonId) ?? 0) + 1);
  let topLesson: Summary['topLesson'] = null;
  for (const [id, n] of byLesson) {
    if (!topLesson || n > topLesson.count) {
      topLesson = { title: getLesson(id)?.title ?? id, count: n };
    }
  }

  const taggedHard = sessions.filter((s) => s.tags.some((t) => HARD_TAGS.has(t)));
  const quietHard = taggedHard.filter((s) => s.response === 'none' || s.response === 'unsure').length;

  const weeks: Summary['weeks'] = [];
  for (let w = 3; w >= 0; w--) {
    const start = now - (w + 1) * 7 * 86400000;
    const end = now - w * 7 * 86400000;
    const inWeek = sessions.filter((s) => {
      const t = Date.parse(s.at);
      return t > start && t <= end;
    });
    weeks.push({
      label: w === 0 ? 'This week' : `${w} wk${w > 1 ? 's' : ''} ago`,
      total: inWeek.length,
      responded: inWeek.filter((s) => s.response === 'clear' || s.response === 'some').length,
    });
  }

  return {
    windowDays: days,
    total: sessions.length,
    withResponse: count('clear') + count('some'),
    clear: count('clear'),
    some: count('some'),
    none: count('none'),
    unsure: count('unsure'),
    unrecorded: count(null),
    taggedHardDays: taggedHard.length,
    hardDayLine:
      taggedHard.length > 0 && quietHard > 0
        ? `${quietHard} of the quieter sessions fell on days you tagged tired, unwell, or similar — quieter responses on hard days are expected with CVI and don't mean going backwards.`
        : null,
    topLesson,
    weeks,
  };
}

/** A plain-text export a caregiver can hand to their vision professional (PT-7, PT-3). */
export function buildShareText(profile: Profile, days = 28): string {
  const s = summarize(profile, days);
  const lines: string[] = [
    `Light & Sound — family observations for "${profile.nickname}"`,
    `Window: last ${days} days · exported ${new Date().toLocaleDateString()}`,
    '',
    'These are informal observations made by family during short at-home',
    'sessions. They are not measurements, assessments, or clinical results.',
    'Responses vary a lot with fatigue, health, and mood on the day.',
    '',
    `Sessions: ${s.total}`,
    `  Responded clearly: ${s.clear}`,
    `  Responded a little: ${s.some}`,
    `  No response noticed: ${s.none}`,
    `  Hard to say: ${s.unsure}`,
    `  Not recorded: ${s.unrecorded}`,
  ];
  if (s.topLesson) lines.push(`Most-used lesson: ${s.topLesson.title} (${s.topLesson.count} sessions)`);
  if (s.taggedHardDays) lines.push(`Sessions on flagged hard days (tired/unwell/etc.): ${s.taggedHardDays}`);
  lines.push('', 'Current settings:');
  const st = profile.settings;
  lines.push(
    `  Colour ${st.targetColor} · size ${st.size}/5 · glow ${st.glow}/3 · brightness ${st.brightness}/3`,
    `  Movement ${st.movement ? `on (speed ${st.speed}/5)` : 'off'} · pace ${st.pace}/5 · complexity ${st.complexity}/3`,
    `  Field: ${st.fieldBias === 'none' ? 'everywhere' : `favouring ${st.fieldBias} (${st.biasStrength})`}`,
    `  Sound: ${st.audioMode === 'with' ? 'with the visual' : st.audioMode === 'after' ? 'after a look' : 'off'} · ${st.audioStyle}`,
  );
  const recent = profile.sessions
    .filter((x) => inWindow(x, days))
    .slice(-12)
    .reverse();
  if (recent.length) {
    lines.push('', 'Recent sessions:');
    for (const r of recent) {
      const d = new Date(r.at).toLocaleDateString();
      const resp =
        r.response === 'clear' ? 'clear response' :
        r.response === 'some' ? 'a little' :
        r.response === 'none' ? 'no response noticed' :
        r.response === 'unsure' ? 'hard to say' : 'not recorded';
      const tags = r.tags.length ? ` [${r.tags.join(', ')}]` : '';
      const note = r.note ? ` — ${r.note}` : '';
      lines.push(`  ${d} · ${getLesson(r.lessonId)?.title ?? r.lessonId} · ${resp}${tags}${note}`);
    }
  }
  const regions = regionInsight(profile);
  if (regions) {
    lines.push('', 'Screen-region notes (family-marked responses; descriptive only):');
    for (const l of regions.lines) lines.push(`  ${l}`);
  }

  lines.push('', 'Made with Light & Sound — a companion tool, not a programme or assessment.');
  return lines.join('\n');
}
