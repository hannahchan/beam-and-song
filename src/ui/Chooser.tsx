import { navigate } from '../lib/router';
import { ensureProfile } from '../lib/store';
import { enabledPhotos } from '../lib/photos';
import { DEFAULT_LESSON_IDS, getLesson } from '../lessons/specs';
import { resolveLesson } from '../lessons/bands';
import { TARGET_COLORS } from '../safety/constants';
import type { LessonSpec } from '../lib/types';

/**
 * The child-side chooser: at most six huge, calm tiles (FR-3, AR-1).
 * Starred lessons come first; sensible Level-1 defaults fill the rest.
 * In practice a grown-up taps here with the baby — so tiles carry a
 * quiet label they can read.
 */
export function Chooser() {
  const profile = ensureProfile();
  const programs = profile.programs.filter((p) => p.lessonIds.length > 0).slice(0, 2);
  const ids = [...profile.favorites];
  for (const d of DEFAULT_LESSON_IDS) {
    if (ids.length >= 6) break;
    if (!ids.includes(d)) ids.push(d);
  }
  const lessons = ids
    .map(getLesson)
    .filter((l): l is LessonSpec => !!l && !(l.requiresPhoto && enabledPhotos(profile.photos).length === 0))
    .map((l) => resolveLesson(l, profile.ageBand))
    .slice(0, Math.max(2, 6 - programs.length));
  const color = TARGET_COLORS[profile.settings.targetColor] ?? TARGET_COLORS.red;

  return (
    <main class="child-screen">
      <h1 class="sr-only">Choose a lesson</h1>
      <div class="chooser">
        {programs.map((p) => (
          <button
            key={p.id}
            class="chooser-tile"
            onClick={() => navigate('/play', { program: p.id })}
            aria-label={`Play the program ${p.name}`}
          >
            <ProgramGlyph color={color} />
            <span>{p.name}</span>
          </button>
        ))}
        {lessons.map((l) => (
          <button
            key={l.id}
            class="chooser-tile"
            onClick={() => navigate('/play', { lesson: l.id })}
            aria-label={`Play ${l.title}`}
          >
            <TileGlyph lesson={l} color={color} />
            <span>{l.title}</span>
          </button>
        ))}
      </div>
      <a class="btn btn-quiet landing-grownups" href="#/grown-ups">
        For grown-ups
      </a>
    </main>
  );
}

/** A little constellation: several lessons strung together. */
function ProgramGlyph({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M22 70 Q40 40 56 52 T84 30" stroke="rgba(174,183,201,0.4)" stroke-width="3" fill="none" />
      <circle cx="22" cy="70" r="12" fill={color} />
      <circle cx="56" cy="52" r="9" fill={color} opacity="0.8" />
      <circle cx="84" cy="30" r="7" fill={color} opacity="0.6" />
    </svg>
  );
}

function TileGlyph({ lesson, color }: { lesson: LessonSpec; color: string }) {
  const soft = 'rgba(174, 183, 201, 0.65)';
  switch (lesson.shape) {
    case 'star':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M50 8 L60.5 36.5 L91 38 L67 57 L75.5 86 L50 69 L24.5 86 L33 57 L9 38 L39.5 36.5 Z"
            fill={color}
            stroke={color}
            stroke-width="8"
            stroke-linejoin="round"
          />
        </svg>
      );
    case 'drop':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 8 C68 38 82 52 82 68 a32 32 0 0 1 -64 0 C18 52 32 38 50 8 Z" fill={color} />
        </svg>
      );
    case 'duck':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="46" cy="62" rx="34" ry="22" fill={color} />
          <circle cx="66" cy="38" r="16" fill={color} />
          <path d="M80 34 Q94 38 80 43 Z" fill={color} opacity="0.7" />
        </svg>
      );
    case 'balloon':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <ellipse cx="50" cy="40" rx="26" ry="32" fill={color} />
          <path d="M50 74 Q58 86 48 96" stroke={color} stroke-width="3" fill="none" opacity="0.7" />
        </svg>
      );
    case 'ball':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="36" fill={color} />
          <ellipse cx="50" cy="70" rx="30" ry="12" fill="#000" opacity="0.22" />
        </svg>
      );
    case 'photo':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <rect x="18" y="24" width="64" height="52" rx="10" fill="none" stroke={soft} stroke-width="6" />
          <circle cx="50" cy="50" r="14" fill={color} />
        </svg>
      );
    case 'boat':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M50 14 Q54 42 76 52 L50 52 Z" fill={color} />
          <path d="M20 58 L80 58 Q72 76 50 76 Q28 76 20 58 Z" fill={color} opacity="0.75" />
        </svg>
      );
    default:
      return lesson.hearingFirst ? (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="9" fill={color} />
          <path d="M67 32 a26 26 0 0 1 0 36 M75 22 a38 38 0 0 1 0 56" stroke={soft} stroke-width="6" fill="none" stroke-linecap="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="30" fill={color} />
          <circle cx="50" cy="50" r="44" fill={color} opacity="0.18" />
        </svg>
      );
  }
}
