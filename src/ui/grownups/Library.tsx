import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import type { LessonSpec, Profile, Program } from '../../lib/types';
import { LESSONS, getLesson } from '../../lessons/specs';
import { resolveLesson } from '../../lessons/bands';
import { addProgram, deleteProgram, toggleFavorite, updateProgram } from '../../lib/store';
import { enabledPhotos } from '../../lib/photos';
import { Card } from './bits';

const resolveFor = (l: LessonSpec, profile: Profile | null) => resolveLesson(l, profile?.ageBand ?? 'infant');

/**
 * FR-4, the browsable lesson library, grouped by level, with starring.
 * Levels are described as what they practise, not as grades to pass (PT-10).
 */
export function Library({ profile }: { profile: Profile | null }) {
  const groups: Array<{ title: string; blurb: ComponentChildren; filter: (l: LessonSpec) => boolean }> = [
    {
      title: 'Level 1 · Noticing',
      blurb: 'One target on a plain dark field. Building the very first visual attention.',
      filter: (l) => l.level === 1 && !l.hearingFirst,
    },
    {
      title: 'Level 2 · Following and finding',
      blurb:
        'Slow movement, gentle choices, anticipation, and a first look-then-touch. For when single targets are sometimes found and held.',
      filter: (l) => l.level === 2 && !l.hearingFirst,
    },
    {
      title: 'Level 3 · Toward the world',
      blurb:
        'Finding one thing among a few, by brightness, by colour, by familiarity, plus small restful scenes and the beginnings of distance. Company on screen stays dim and calm.',
      filter: (l) => l.level === 3 && !l.hearingFirst,
    },
    {
      title: 'Level 4 · Higher-order looking',
      blurb: (
        <>
          Visual search among drifting company, following through distraction, an ordered left-to-right
          sweep, and familiar faces. The challenge comes from the looking itself. These lessons never get
          faster, brighter, or flashier than the gentle ones (
          <a href="#/grown-ups/guide?topic=safety">how lessons stay gentle</a>).
        </>
      ),
      filter: (l) => l.level === 4 && !l.hearingFirst,
    },
    {
      title: 'Listening lessons',
      blurb:
        'Hearing is a goal of its own here, not just a helper for looking. A little ladder of its own: noticing sound, turning toward it, telling sounds apart, and finally sound leading the eyes.',
      filter: (l) => !!l.hearingFirst,
    },
  ];

  return (
    <div>
      <h1 tabindex={-1}>Lessons</h1>
      <p class="card-note">
        Star the ones that suit {profile?.nickname ?? 'your child'}; starred lessons become the big tiles on
        their screen. Every lesson follows the colour, size, pace, sound, and <b>age</b> choices in Settings:
        the same practice is presented differently for a baby, a child, or a teen. When in doubt about level,
        start lower: comfort first, challenge second. Prefer to see them?{' '}
        <a href="#/grown-ups/review">Walk through every lesson, one after another</a>.
      </p>
      {profile && <Programs profile={profile} />}
      {groups.map((g) => (
        <section key={g.title}>
          <h2 style={{ marginTop: '1.6rem' }}>{g.title}</h2>
          <p class="card-note">{g.blurb}</p>
          <div class="lesson-grid">
            {LESSONS.filter(g.filter).map((l) => (
              <LessonCard key={l.id} lesson={l} profile={profile} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * PT-9, named, ordered lesson sequences. Reordering uses plain up/down
 * buttons so it works by keyboard and switch, never drag-only (AR-2).
 */
function Programs({ profile }: { profile: Profile }) {
  const [newName, setNewName] = useState('');
  return (
    <Card title="Programs: a sequence for one session">
      <p class="card-note">
        String a few lessons into a named session, yours or one your vision professional suggests. Programs
        appear as tiles on the child screen and play in order, each lesson handing over with a slow fade. A
        lovely shape: an easy favourite first as the warm-up, then the newer work, and something restful to
        end on.
      </p>
      {profile.programs.map((prog) => (
        <ProgramEditor key={prog.id} profile={profile} program={prog} />
      ))}
      <form
        class="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (newName.trim()) {
            addProgram(profile.id, newName);
            setNewName('');
          }
        }}
      >
        <label class="field" style={{ flex: 1, minWidth: '12rem', margin: 0 }}>
          <span class="field-label">New program name</span>
          <input
            type="text"
            maxLength={40}
            value={newName}
            placeholder="e.g. Morning quiet time"
            onInput={(e) => setNewName((e.target as HTMLInputElement).value)}
          />
        </label>
        <button class="btn" type="submit">
          Create
        </button>
      </form>
    </Card>
  );
}

function ProgramEditor({ profile, program }: { profile: Profile; program: Program }) {
  const [adding, setAdding] = useState(LESSONS[0].id);
  const available = LESSONS.filter((l) => !(l.requiresPhoto && enabledPhotos(profile.photos).length === 0));
  const move = (i: number, dir: -1 | 1) =>
    updateProgram(profile.id, program.id, (p) => {
      const j = i + dir;
      if (j < 0 || j >= p.lessonIds.length) return;
      [p.lessonIds[i], p.lessonIds[j]] = [p.lessonIds[j], p.lessonIds[i]];
    });

  return (
    <div class="card" style={{ background: 'var(--bg2)' }}>
      <div class="spread">
        <h3 style={{ margin: 0 }}>{program.name}</h3>
        <div class="row">
          {program.lessonIds.length > 0 && (
            <a class="btn btn-small btn-primary" href={`#/play?program=${program.id}`}>
              Play
            </a>
          )}
          <button class="btn btn-small btn-danger" onClick={() => deleteProgram(profile.id, program.id)}>
            Delete
          </button>
        </div>
      </div>
      <ol style={{ margin: '0.6rem 0', paddingLeft: '1.4rem' }}>
        {program.lessonIds.map((id, i) => {
          const title = getLesson(id) ? resolveFor(getLesson(id)!, profile).title : id;
          return (
            <li key={`${id}-${i}`} style={{ margin: '0.3rem 0' }}>
              <span class="row" style={{ gap: '0.4rem' }}>
                <span style={{ flex: 1, minWidth: '9rem' }}>{title}</span>
                <button class="btn btn-small btn-ghost" aria-label={`Move ${title} earlier`} disabled={i === 0} onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button
                  class="btn btn-small btn-ghost"
                  aria-label={`Move ${title} later`}
                  disabled={i === program.lessonIds.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
                <button
                  class="btn btn-small btn-ghost"
                  aria-label={`Remove ${title} from ${program.name}`}
                  onClick={() => updateProgram(profile.id, program.id, (p) => p.lessonIds.splice(i, 1))}
                >
                  ✕
                </button>
              </span>
            </li>
          );
        })}
      </ol>
      <div class="row">
        <label class="field" style={{ flex: 1, minWidth: '11rem', margin: 0 }}>
          <span class="sr-only">Lesson to add to {program.name}</span>
          <select value={adding} onChange={(e) => setAdding((e.target as HTMLSelectElement).value)}>
            {available.map((l) => (
              <option key={l.id} value={l.id}>
                {resolveFor(l, profile).title} (Level {l.level}
                {l.hearingFirst ? ', listening' : ''})
              </option>
            ))}
          </select>
        </label>
        <button
          class="btn btn-small"
          onClick={() => updateProgram(profile.id, program.id, (p) => p.lessonIds.push(adding))}
        >
          Add lesson
        </button>
      </div>
      {program.lessonIds.length > 4 && (
        <p class="hint">Long programs make long sessions. A few lessons is usually plenty (each gets at least 45 seconds).</p>
      )}
    </div>
  );
}

function LessonCard({ lesson: base, profile }: { lesson: LessonSpec; profile: Profile | null }) {
  const lesson = resolveFor(base, profile);
  const starred = profile?.favorites.includes(lesson.id) ?? false;
  const locked = lesson.requiresPhoto && enabledPhotos(profile?.photos ?? []).length === 0;

  return (
    <article class="lesson-card" id={`lesson-card-${lesson.id}`} tabIndex={-1}>
      <span class="lesson-theme">{lesson.theme}</span>
      <div class="spread">
        <h3>{lesson.title}</h3>
        {profile && (
          <button
            class="btn btn-small btn-ghost"
            aria-pressed={starred}
            aria-label={starred ? `Remove ${lesson.title} from child screen` : `Add ${lesson.title} to child screen`}
            onClick={() => toggleFavorite(profile.id, lesson.id)}
          >
            {starred ? '★ On child screen' : '☆ Star'}
          </button>
        )}
      </div>
      <span class="lesson-skill">Practises: {lesson.skill}</span>
      <p class="card-note">{lesson.goal}</p>
      {lesson.quietPreferred && (
        <p class="card-note">
          This kind of looking is easier in quiet, so the music waits during this lesson: the search
          happens in silence, and sound arrives as the answer to a touch. Choose “No sound” in Settings
          to silence it entirely.
        </p>
      )}
      <details>
        <summary>What to watch for</summary>
        <p class="card-note">{lesson.watchFor}</p>
        <p class="card-note">
          <b>Off the screen:</b> {lesson.bridge}
        </p>
        <StepLinks lesson={lesson} profile={profile} />
      </details>
      {locked ? (
        <a class="btn btn-small" href="#/grown-ups/settings">
          Add a photo in Settings to unlock
        </a>
      ) : (
        <a class="btn btn-small btn-primary" href={`#/play?lesson=${lesson.id}`}>
          Play now
        </a>
      )}
    </article>
  );
}

/**
 * PT-10, every lesson can point at a gentler and a bolder neighbour, so
 * "feels early" and "feels easy" both have somewhere obvious to go. The
 * links describe the lessons, never the child (SR-7).
 */
function StepLinks({ lesson, profile }: { lesson: LessonSpec; profile: Profile | null }) {
  const back = lesson.stepBack ? getLesson(lesson.stepBack) : undefined;
  const up = lesson.stepUp ? getLesson(lesson.stepUp) : undefined;
  if (!back && !up) return null;
  const jump = (id: string) => {
    const el = document.getElementById(`lesson-card-${id}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLElement).focus({ preventScroll: true });
  };
  return (
    <p class="card-note">
      {back && (
        <>
          If it feels early, try{' '}
          <button class="lesson-step" onClick={() => jump(back.id)}>
            {resolveFor(back, profile).title}
          </button>{' '}
          first.
        </>
      )}
      {back && up && ' '}
      {up && (
        <>
          When it feels easy,{' '}
          <button class="lesson-step" onClick={() => jump(up.id)}>
            {resolveFor(up, profile).title}
          </button>{' '}
          is a natural next step.
        </>
      )}
    </p>
  );
}
