import type { Profile } from '../../lib/types';
import { getLesson } from '../../lessons/specs';
import { resolveLesson } from '../../lessons/bands';
import { summarize, inWindow } from '../../lib/summary';
import { regionInsight } from '../../lib/regions';
import { formatDate, formatMinutes, plural } from '../../lib/fmt';
import {
  AUDIO_MODE_LABELS,
  AUDIO_STYLE_LABELS,
  BACKGROUND_LABELS,
  BIAS_STRENGTH_LABELS,
  COLOR_LABELS,
  FIELD_BIAS_LABELS,
  TAG_LABELS,
} from '../../lib/labels';

/**
 * PT-7 — a one-page, clinic-friendly version of the share summary.
 * On screen it keeps the app theme; on paper it prints clean black-on-white
 * (see the @media print rules). Same non-diagnostic framing as everywhere.
 */
export function PrintSummary({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <main class="gu-shell">
        <p>
          No child selected. <a href="#/grown-ups">Back to the grown-up area.</a>
        </p>
      </main>
    );
  }
  const s = summarize(profile, 28);
  const st = profile.settings;
  const regions = regionInsight(profile);
  const recent = profile.sessions
    .filter((x) => inWindow(x, 28))
    .slice(-10)
    .reverse();
  const lessonTitle = (id: string) => {
    const l = getLesson(id);
    return l ? resolveLesson(l, profile.ageBand).title : id;
  };

  return (
    <main class="print-sheet">
      <div class="row no-print" style={{ padding: '1rem 0' }}>
        <button class="btn btn-primary" onClick={() => window.print()}>
          Print this page
        </button>
        <a class="btn btn-ghost" href="#/grown-ups/sessions">
          Back to Notes
        </a>
      </div>

      <h1>Light & Sound — family observations for “{profile.nickname}”</h1>
      <p class="print-muted">
        Last 28 days · prepared {formatDate(Date.now())} · These are informal observations made by
        family during short at-home sessions. They are not measurements, clinical results, or any kind of
        evaluation; responses vary a lot with tiredness, health, and mood on the day.
      </p>

      <h2>Sessions</h2>
      <p>
        {s.total} short {plural(s.total, { one: 'session', other: 'sessions' })} · responded clearly: {s.clear} · a little: {s.some} ·
        no response noticed: {s.none} · hard to say: {s.unsure} · not recorded: {s.unrecorded}
        {s.topLesson ? ` · most-used lesson: ${s.topLesson.title}` : ''}
      </p>
      {s.hardDayLine && <p class="print-muted">{s.hardDayLine}</p>}

      <h2>Current settings</h2>
      <ul>
        <li>
          Colour {COLOR_LABELS[st.targetColor]} · size {st.size}/5 · glow {st.glow}/3 · brightness {st.brightness}/3 ·
          background {BACKGROUND_LABELS[st.background]}
        </li>
        <li>
          Movement {st.movement ? `on (speed ${st.speed}/5)` : 'off'} · pace {st.pace}/5 · complexity{' '}
          {st.complexity}/3 · field:{' '}
          {st.fieldBias === 'none'
            ? FIELD_BIAS_LABELS.none
            : `favouring ${FIELD_BIAS_LABELS[st.fieldBias]} (${BIAS_STRENGTH_LABELS[st.biasStrength]})`}
        </li>
        <li>
          Sound: {AUDIO_MODE_LABELS[st.audioMode]} · {AUDIO_STYLE_LABELS[st.audioStyle]} · sound follows target:{' '}
          {st.soundFollowsTarget ? 'yes' : 'no'} · session length {formatMinutes(st.sessionMinutes)} · age
          presentation: {profile.ageBand}
        </li>
      </ul>

      {regions && (
        <>
          <h2>Screen-region notes (optional feature, descriptive only)</h2>
          {regions.lines.map((l) => (
            <p key={l} class="print-muted">
              {l}
            </p>
          ))}
        </>
      )}

      <h2>Recent sessions</h2>
      <table class="print-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Lesson</th>
            <th>Response</th>
            <th>Day notes</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.at)}</td>
              <td>{r.programName ? `${r.programName} (program)` : lessonTitle(r.lessonId)}</td>
              <td>
                {r.response === 'clear'
                  ? 'clear'
                  : r.response === 'some'
                    ? 'a little'
                    : r.response === 'none'
                      ? 'none noticed'
                      : r.response === 'unsure'
                        ? 'hard to say'
                        : '—'}
              </td>
              <td>
                {r.tags.map((t) => TAG_LABELS[t]).join(', ')}
                {r.note ? `${r.tags.length ? ' · ' : ''}“${r.note}”` : ''}
              </td>
            </tr>
          ))}
          {recent.length === 0 && (
            <tr>
              <td colSpan={4}>No sessions recorded in this window.</td>
            </tr>
          )}
        </tbody>
      </table>

      <p class="print-muted">
        Light & Sound is a companion tool used alongside the child's vision professional — not a programme,
        curriculum, or assessment. All data lives only on the family's device; this page was printed by the
        caregiver.
      </p>
    </main>
  );
}
