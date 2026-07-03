import type { LessonSpec, Profile } from '../../lib/types';
import { LESSONS } from '../../lessons/specs';
import { toggleFavorite } from '../../lib/store';

/**
 * FR-4 — the browsable lesson library, grouped by level, with starring.
 * Levels are described as what they practise, not as grades to pass (PT-10).
 */
export function Library({ profile }: { profile: Profile | null }) {
  const groups: Array<{ title: string; blurb: string; filter: (l: LessonSpec) => boolean }> = [
    {
      title: 'Level 1 · Noticing',
      blurb: 'One target on a plain dark field. Building the very first visual attention.',
      filter: (l) => l.level === 1 && !l.hearingFirst,
    },
    {
      title: 'Level 2 · Following and finding',
      blurb: 'Slow movement, gentle choices, familiar things. For babies who sometimes find and hold a target.',
      filter: (l) => l.level === 2 && !l.hearingFirst,
    },
    {
      title: 'Listening lessons',
      blurb: 'Hearing is a goal of its own here — not just a helper for looking. Lovely when sound is the stronger doorway.',
      filter: (l) => !!l.hearingFirst,
    },
  ];

  return (
    <div>
      <h1 tabindex={-1}>Lessons</h1>
      <p class="card-note" style={{ maxWidth: '46rem' }}>
        Star the ones that suit {profile?.nickname ?? 'your baby'} — starred lessons become the big tiles on the
        child screen. Every lesson follows the colour, size, pace, and sound choices in Settings. When in doubt
        about level, start lower: comfort first, challenge second.
      </p>
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

function LessonCard({ lesson, profile }: { lesson: LessonSpec; profile: Profile | null }) {
  const starred = profile?.favorites.includes(lesson.id) ?? false;
  const locked = lesson.requiresPhoto && (profile?.photos.length ?? 0) === 0;

  return (
    <article class="lesson-card">
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
      <p class="card-note">{lesson.goal}</p>
      <details>
        <summary>What to watch for</summary>
        <p class="card-note">{lesson.watchFor}</p>
        {lesson.bridge && (
          <p class="card-note">
            <b>Off the screen:</b> {lesson.bridge}
          </p>
        )}
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
