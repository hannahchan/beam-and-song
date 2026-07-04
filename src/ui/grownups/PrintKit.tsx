import { useMemo } from 'preact/hooks';
import type { Profile, ShapeKind } from '../../lib/types';
import { TARGET_COLORS } from '../../safety/constants';
import { shapeSprite } from '../../engine/render';
import { bandNoun } from '../../lessons/bands';

/**
 * CR-4 — the off-screen kit: the same shapes the lessons use, one per page,
 * big and bold in the child's own colour, ready to print. Screens are the
 * doorway; these sheets are the step between the screen and the real thing.
 * Zero assets — every image is drawn on the fly by the same code that draws
 * the lessons, so the printed ball matches the on-screen ball exactly.
 */

interface KitEntry {
  shape: ShapeKind;
  name: string;
  tip: string;
  /** The teen band swaps the babyish members of the cast (CR-9/CR-10). */
  teen?: { shape?: ShapeKind; name?: string; tip?: string };
}

const KIT: readonly KitEntry[] = [
  {
    shape: 'orb',
    name: 'The circle of light',
    tip: 'The very first friend from the screen. Rest it on the dark cloth and let it simply be found — no pointing, no asking.',
  },
  {
    shape: 'star',
    name: 'The star',
    tip: 'Hold it very still, a little to their better side, and give the look all the time it wants to arrive.',
  },
  {
    shape: 'ball',
    name: 'The ball',
    tip: 'Show this sheet, then the real ball in the same colour — sheet first, real thing next; that link is the whole point.',
  },
  {
    shape: 'duck',
    name: 'The duck',
    tip: 'Glide it slowly along the edge of a table like water, pausing in the middle, just as it moves on screen.',
    teen: {
      shape: 'boat',
      name: 'The boat',
      tip: 'Glide it slowly along a table edge like still water, pausing midway, just as it moves on screen.',
    },
  },
  {
    shape: 'balloon',
    name: 'The balloon',
    tip: 'Lift it slowly upward from where they see best, and let the eyes travel with it.',
  },
  {
    shape: 'drop',
    name: 'The raindrop',
    tip: 'Slide it slowly down a wall or window frame, top to bottom, and land it with a little sound from you.',
  },
] as const;

export function PrintKit({ profile }: { profile: Profile | null }) {
  if (!profile) {
    return (
      <main class="print-sheet">
        <p>
          No child selected. <a href="#/grown-ups">Back to the grown-up area.</a>
        </p>
      </main>
    );
  }
  return <PrintKitInner profile={profile} />;
}

function PrintKitInner({ profile }: { profile: Profile }) {
  const color = TARGET_COLORS[profile.settings.targetColor] ?? TARGET_COLORS.red;
  const teen = profile.ageBand === 'teen';
  const pages = useMemo(
    () =>
      KIT.map((e) => {
        const shape = (teen && e.teen?.shape) || e.shape;
        return {
          shape,
          name: (teen && e.teen?.name) || e.name,
          tip: (teen && e.teen?.tip) || e.tip,
          src: shapeSprite(shape, color),
        };
      }),
    [color, teen],
  );
  const noun = bandNoun(profile.ageBand);

  return (
    <main class="print-sheet">
      <div class="row no-print" style={{ padding: '1rem 0' }}>
        <button class="btn btn-primary" onClick={() => window.print()}>
          Print the kit
        </button>
        <a class="btn btn-ghost" href="#/grown-ups/guide">
          Back to the Guide
        </a>
      </div>

      <h1>Beam and Song — an off-screen kit for “{profile.nickname}”</h1>
      <p>
        One page per shape, in {profile.nickname}'s colour — the same shapes, drawn by the same code, as the
        lessons on screen. Screens are the doorway, not the destination: these sheets are the step in
        between, before the real ball, the real light, the real world.
      </p>
      <h2>How to use it</h2>
      <ul>
        <li>Print in colour if you can, on matte paper (less glare). One sheet at a time.</li>
        <li>
          Rest the sheet on a plain dark background — a dark cloth, a black card — so the shape is the only
          interesting thing there, just like on screen.
        </li>
        <li>Dim the room a little, offer the sheet slowly, and wait longer than feels natural.</li>
        <li>
          Everything from the lessons still applies: one thing at a time, {noun === 'they' ? 'their' : `${noun}'s`}{' '}
          better side first, quiet while looking, and stop while it is still going well.
        </li>
        <li>Follow each sheet with the real thing whenever one exists — sheet first, real thing next.</li>
      </ul>
      <p class="print-muted">
        A companion alongside {profile.nickname}'s vision professional, never a programme or an assessment.
        Printed by the caregiver; nothing about this kit is stored or sent anywhere.
      </p>

      {pages.map((p) => (
        <section key={p.name} class="kit-page">
          <img src={p.src} alt={`${p.name} in ${profile.settings.targetColor}, filling the page`} />
          <p class="kit-caption">
            <b>{p.name}.</b> {p.tip}
          </p>
        </section>
      ))}
    </main>
  );
}
