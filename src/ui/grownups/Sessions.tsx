import type { Profile } from '../../lib/types';
import { getLesson } from '../../lessons/specs';
import { buildShareText, summarize } from '../../lib/summary';
import { regionInsight } from '../../lib/regions';
import { exportProfile } from '../../lib/store';
import { Card, downloadFile } from './bits';

/** PT-4 / PT-7 / PT-8 — notes, a readable trend, and a shareable summary. */
export function Sessions({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <div>
        <h1 tabindex={-1}>Notes</h1>
        <p>
          First, add a child on the <a href="#/grown-ups/profiles">Children page</a>.
        </p>
      </div>
    );
  }

  const s = summarize(profile, 28);
  const recent = [...profile.sessions].reverse().slice(0, 30);
  const maxWeek = Math.max(1, ...s.weeks.map((w) => w.total));

  return (
    <div class="stack">
      <h1 tabindex={-1}>Notes for {profile.nickname}</h1>
      <p class="card-note">
        These are your own informal observations — a picture that builds over weeks, not a test of any kind. CVI
        function genuinely swings day to day with tiredness, health, and mood; single days mean very little on
        their own.
      </p>

      <Card title="The last four weeks">
        {s.total === 0 ? (
          <p class="card-note">Nothing noted yet — after each lesson you'll be offered a ten-second note.</p>
        ) : (
          <>
            <p>
              {s.total} session{s.total === 1 ? '' : 's'} · a response you noticed in {s.withResponse} · clearest
              friend so far: {s.topLesson ? <b>{s.topLesson.title}</b> : '—'}
            </p>
            <div class="bars" role="img" aria-label={weeksAria(s.weeks)}>
              {s.weeks.map((w) => (
                <div key={w.label} class="bar-row" aria-hidden="true">
                  <span>{w.label}</span>
                  <div class="bar-track">
                    <div class="bar-fill" style={{ width: `${(w.total / maxWeek) * 100}%` }} />
                  </div>
                  <span>
                    {w.responded}/{w.total}
                  </span>
                </div>
              ))}
            </div>
            <p class="card-note">Bar = sessions that week; the number is how many had a response you noticed.</p>
            {s.hardDayLine && <p class="card-note">{s.hardDayLine}</p>}
          </>
        )}
      </Card>

      <RegionCard profile={profile} />

      <Card title="Share with the vision team">
        <p class="card-note">
          Both files are saved to <b>this device</b> for you to share however you choose — nothing is sent
          anywhere by the app. They contain personal notes about {profile.nickname}, so treat them like any
          private document.
        </p>
        <div class="row">
          <a class="btn" href="#/grown-ups/print">
            Print a one-pager for the clinic
          </a>
          <button
            class="btn"
            onClick={() => downloadFile(`light-and-sound-summary-${profile.nickname}.txt`, buildShareText(profile), 'text/plain')}
          >
            Save a readable summary (.txt)
          </button>
          <button
            class="btn btn-ghost"
            onClick={() => {
              const data = exportProfile(profile.id);
              if (data) downloadFile(`light-and-sound-profile-${profile.nickname}.json`, JSON.stringify(data, null, 2), 'application/json');
            }}
          >
            Save the full profile (.json)
          </button>
        </div>
      </Card>

      <Card title="Recent sessions">
        {recent.length === 0 && <p class="card-note">None yet.</p>}
        {recent.map((r) => (
          <div key={r.id} class="session-item">
            <span>
              <b>{r.programName ? `${r.programName} (program)` : (getLesson(r.lessonId)?.title ?? r.lessonId)}</b>
              <span class="card-note"> · {new Date(r.at).toLocaleDateString()} · {Math.max(1, Math.round(r.durationSec / 60))} min</span>
              {r.tags.map((t) => (
                <span key={t} class="tag-pill">
                  {t}
                </span>
              ))}
              {r.note && <div class="card-note">“{r.note}”</div>}
            </span>
            <span class="card-note">{responseWord(r.response)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/**
 * PT-13 surface — appears only when the optional setting is on AND enough
 * sessions across enough weeks exist. Descriptive and tentative by design;
 * interpretation always routes to the professional (SR-7).
 */
function RegionCard({ profile }: { profile: Profile }) {
  const insight = regionInsight(profile);
  if (!profile.settings.fieldObservation) return null;
  return (
    <Card title="Where looks landed (optional)">
      {insight ? (
        <>
          {insight.lines.map((l) => (
            <p key={l} class={l.startsWith('Across') ? '' : 'card-note'}>
              {l}
            </p>
          ))}
          {insight.suggestion && <p>{insight.suggestion}</p>}
        </>
      ) : (
        <p class="card-note">
          This builds quietly in the background. Once there are at least a couple of weeks of sessions with
          marked responses, anything worth mentioning appears here — described gently, never as a measurement.
        </p>
      )}
    </Card>
  );
}

function responseWord(r: 'clear' | 'some' | 'none' | 'unsure' | null): string {
  switch (r) {
    case 'clear':
      return 'responded clearly';
    case 'some':
      return 'a little';
    case 'none':
      return 'not this time';
    case 'unsure':
      return 'hard to say';
    default:
      return 'not recorded';
  }
}

function weeksAria(weeks: Array<{ label: string; total: number; responded: number }>): string {
  return (
    'Sessions per week: ' +
    weeks.map((w) => `${w.label}: ${w.total} sessions, ${w.responded} with a response`).join('; ')
  );
}
