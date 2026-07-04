import type { Profile } from '../../lib/types';
import { backupIsDue, createProfile, exportAll, getState, reviewIsDue } from '../../lib/store';
import { getLesson, DEFAULT_LESSON_IDS } from '../../lessons/specs';
import { summarize } from '../../lib/summary';
import { getPreset } from '../../lib/presets';
import { Card, downloadFile } from './bits';
import { useState } from 'preact/hooks';

export function Dashboard({ profile }: { profile: Profile | null }) {
  if (!profile) return <Welcome />;

  const summary = summarize(profile, 14);
  const preset = profile.presetId ? getPreset(profile.presetId) : undefined;
  const firstLesson = getLesson(profile.favorites[0] ?? DEFAULT_LESSON_IDS[0]);

  return (
    <div class="stack">
      <h1 tabindex={-1}>Hello — this is {profile.nickname}'s space</h1>

      {!profile.presetId && (
        <Card title="Two minutes to a good starting point">
          <p>
            Answer five quick questions about what {profile.nickname} notices, and we'll suggest a starting setup.
            You can change anything later — with your vision professional's advice wherever possible.
          </p>
          <a class="btn btn-primary" href="#/grown-ups/setup">
            Start guided setup
          </a>
        </Card>
      )}

      {backupIsDue(getState()) && (
        <Card title="Worth a backup?">
          <p class="card-note">
            Notes and photos live only in this browser, and browsers can clear rarely-used site data. One file
            keeps everything safe (recordings stay on this device). It contains personal information about your
            child — keep it somewhere you trust.
          </p>
          <button
            class="btn"
            onClick={() => downloadFile('light-and-sound-backup.json', JSON.stringify(exportAll(), null, 2), 'application/json')}
          >
            Save a backup now
          </button>
        </Card>
      )}

      {reviewIsDue(profile) && (
        <Card title="Time for a gentle settings review?">
          <p>
            It's been a while since settings changed, and CVI can shift over months. Have a look at the recent
            notes, then see whether colour, pace, or complexity still fit — ideally together with your vision
            professional.
          </p>
          <div class="row">
            <a class="btn" href="#/grown-ups/sessions">
              See recent notes
            </a>
            <a class="btn" href="#/grown-ups/settings">
              Review settings
            </a>
          </div>
        </Card>
      )}

      <Card title="Start a lesson">
        <p class="card-note">
          {preset ? `Current setup: “${preset.title}”. ` : ''}
          Short and often beats long and rare — a few minutes is a full session.
        </p>
        <div class="row">
          {firstLesson && (
            <a class="btn btn-primary" href={`#/play?lesson=${firstLesson.id}`}>
              Play {firstLesson.title}
            </a>
          )}
          <a class="btn" href="#/choose">
            Open the child screen
          </a>
          <a class="btn btn-ghost" href="#/grown-ups/library">
            Browse all lessons
          </a>
        </div>
      </Card>

      <Card title="The last two weeks">
        {summary.total === 0 ? (
          <p class="card-note">
            No sessions noted yet. After each lesson you'll be offered a ten-second note — they build into a
            picture you can share with {profile.nickname}'s vision team.
          </p>
        ) : (
          <>
            <p>
              {summary.total} short session{summary.total === 1 ? '' : 's'};{' '}
              {summary.withResponse > 0
                ? `a response you noticed in ${summary.withResponse} of them.`
                : 'no clear responses noted — which is common early on, and still useful to know.'}
            </p>
            {summary.hardDayLine && <p class="card-note">{summary.hardDayLine}</p>}
            <a class="btn btn-small" href="#/grown-ups/sessions">
              See notes &amp; trends
            </a>
          </>
        )}
      </Card>

      <Card title="Setting up the room helps more than any slider">
        <p class="card-note">
          Dim the room, avoid windows or lamps behind the screen, bring the screen close (30–50 cm), and make
          sure {profile.nickname} is comfortably supported. More in the guide.
        </p>
        <a class="btn btn-small" href="#/grown-ups/guide">
          Read the guide
        </a>
      </Card>
    </div>
  );
}

function Welcome() {
  const [name, setName] = useState('');
  return (
    <div class="stack">
      <h1 tabindex={-1}>Welcome</h1>
      <Card title="Light & Sound, in one breath">
        <p>
          Gentle, tuneable light-and-sound lessons for babies with CVI (cortical/cerebral visual impairment) — built
          to be adjusted to <em>your</em> baby, used in short sessions, alongside your vision professional or
          early-intervention team.
        </p>
      </Card>
      <Card title="First: who is this for?">
        <form
          class="row"
          onSubmit={(e) => {
            e.preventDefault();
            createProfile(name);
            location.hash = '#/grown-ups/setup';
          }}
        >
          <label class="field" style={{ flex: 1, minWidth: '14rem', margin: 0 }}>
            <span class="field-label">A nickname for your child</span>
            <p class="hint">A first name or nickname is plenty — no full names or birthdays needed, ever.</p>
            <input
              type="text"
              value={name}
              maxLength={40}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              placeholder="e.g. Bean"
            />
          </label>
          <button class="btn btn-primary" type="submit">
            Create &amp; set up
          </button>
        </form>
      </Card>
    </div>
  );
}

