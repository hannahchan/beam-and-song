import type { AgeBand, BandVariant, LessonSpec } from '../lib/types';

/**
 * CR-9 / CR-10 / CR-11 — age is an axis, not a different product.
 *
 * Lesson specs (specs.ts) are written for the infant band. This map re-skins
 * them for older bands: same behaviors, same safety kernel, different theme,
 * music, and tone. A teen at Level 1 gets a single high-salience ember on
 * black with an ambient line — never a duck with a nursery rhyme.
 *
 * The `child` band (roughly 2–9) mostly keeps the warm content with adjusted
 * wording (handled mechanically in resolve.ts); explicit entries below are
 * only where wording alone isn't enough. The `teen` band is fully re-skinned.
 */
export const BAND_VARIANTS: Record<string, Partial<Record<'child' | 'teen', BandVariant>>> = {
  'gentle-glow': {
    teen: {
      title: 'Ember',
      melody: 'ember',
      goal: 'One warm light on a dark screen, breathing very slowly with a low, calm line of music. The simplest place to begin: just noticing that something is there.',
      watchFor:
        'Going still or quiet, eyes widening, or turning toward the screen. A look can arrive many seconds after the light appears — that pause is part of CVI at any age.',
    },
  },
  'little-star': {
    teen: {
      title: 'North Star',
      melody: 'nightSky',
      goal: 'A single star shimmering gently against the dark, with slow ambient tones. A slightly livelier target, still one thing on a plain field.',
      watchFor: 'Eyes settling on the star and holding a little longer over the weeks.',
    },
  },
  'drifting-light': {
    teen: {
      title: 'Drift',
      goal: 'A light drifts slowly from one side to the other — practice at following with the eyes. With movement off in settings, the light rests in one place instead.',
      watchFor: 'Eyes or head following even part of the way, or finding the light again after losing it. Losing and re-finding is real progress.',
    },
  },
  'magic-touch': {
    teen: {
      title: 'Pulse',
      goal: 'Cause and effect: a touch anywhere on the screen — or a switch press — makes the light bloom softly and answer with sound. Nothing needs aiming.',
      watchFor: 'Any deliberate movement toward the screen, then a pause to take in what happened.',
      bridge: 'Off screen, pair the same idea with something physical they enjoy — a speaker that plays a bar of their music at a touch.',
    },
  },
  firefly: {
    teen: {
      title: 'Night Lights',
      melody: 'nightSky',
      goal: 'A small light rests, melts away, and reappears somewhere new — noticing and re-finding, tuned to the screen region you set.',
      watchFor: 'Searching looks after the light fades, and finding it in its new place.',
    },
  },
  raindrop: {
    teen: {
      title: 'Rain on Glass',
      goal: 'A drop of light slides slowly down the screen and lands with a soft note. Vertical tracking with a quiet, satisfying ending.',
      watchFor: 'Eyes riding the drop downward, or a settled reaction to the landing note.',
    },
  },
  'star-path': {
    teen: {
      title: 'Orbit',
      melody: 'tideGlass',
      goal: 'The point of light travels a slow curve — and with "sound follows the target" on, its tone travels with it, joining looking and listening.',
      watchFor: 'Smoother following along the curve, or turning toward the side the sound has moved to.',
    },
  },
  'two-fireflies': {
    teen: {
      title: 'Signals',
      melody: 'ember',
      goal: 'Two resting lights. One at a time brightens and sounds, inviting a look — a gentle experience of choosing where to look. A touch anywhere makes the bright one answer.',
      watchFor: 'A look that moves to whichever light is glowing, even slowly.',
    },
  },
  'rolling-ball': {
    teen: {
      title: 'Rolling In',
      melody: 'tideGlass',
      goal: 'A ball rolls gently in, settles, and rests — an everyday object as the target. A touch gives it a soft little bounce.',
      watchFor: 'Recognition: brightening as it rolls in, glancing to where it settles.',
      bridge: 'Follow with the real thing: pass a real ball between you at the same unhurried pace.',
    },
  },
  'little-duck': {
    teen: {
      title: 'Night Boat',
      shape: 'boat',
      melody: 'tideGlass',
      goal: 'A small boat glides across still water, pausing midway. A familiar shape, slow movement, simple ground.',
      watchFor: 'Following the boat across, or a flicker of recognition at the pause.',
      bridge: 'If they have an object that "travels" — a model car, a boat — bring it out afterwards and glide it the same slow way.',
    },
  },
  balloon: {
    teen: {
      title: 'Sky Lantern',
      melody: 'ember',
      goal: 'A lantern-light drifts slowly upward and away, then another follows — practice lifting the gaze outward from where they see best. A touch makes it sway.',
      watchFor: 'Eyes lifting with it a little further each time.',
    },
  },
  'familiar-photo': {
    teen: {
      title: 'A Familiar Face or Thing',
      melody: 'ember',
      goal: 'Your own photo — someone they love, or a thing they genuinely care about — fading gently in on a plain background. Familiarity is the strongest doorway at any age. Add a photo in Settings to unlock this lesson; photos stay on this device only.',
      watchFor: 'A different quality of attention than for shapes: longer, warmer, more searching.',
      bridge: 'Show the real thing — or the real person — right after the screen version.',
    },
  },
  'traveling-song': {
    teen: {
      title: 'Crossing Song',
      melody: 'nightSky',
      goal: 'A listening lesson: the screen rests almost dark while slow tones drift from one side to the other. Listening is the goal — looking is not required. Best with the device propped up and its own speakers.',
      watchFor: 'Going still to listen, eyes shifting, or the head turning toward the side the sound has moved to.',
    },
  },
  'find-the-star': {
    teen: {
      title: 'Find the Signal',
      melody: 'tideGlass',
      goal: 'One brighter point rests among a few dim companions — finding a thing among other things. A touch near it (or any switch press) makes it answer. The complexity setting decides how much company appears.',
      watchFor: 'Eyes moving between the shapes and settling on the bright one, even after a long think. Finding it slowly still counts.',
    },
  },
  'find-your-photo': {
    teen: {
      title: 'Spot the Familiar',
      melody: 'ember',
      goal: 'Their own familiar thing — something they genuinely care about — resting among a few dim shapes. Familiarity does the finding at first; that is the point. Add a photo in Settings to unlock.',
      watchFor: 'A quicker, warmer settle on the photo than on the shapes around it.',
      bridge: 'Play the same game in the room: the real object among two others, offered slowly.',
    },
  },
  'near-and-far': {
    teen: {
      title: 'Near and Far',
      melody: 'nightSky',
      goal: 'The light returns large, then smaller, then small — like something seen from across a room. Smaller sizes gently work the beginnings of distance viewing.',
      watchFor: 'Whether the small appearances still earn a look, or only the large ones — a useful thing to notice, and only ever that.',
      bridge: 'Try the real-world version: a favourite object close, then from across the room, unhurried.',
    },
  },
  'hidden-among-many': {
    teen: {
      title: 'Hidden in the Field',
      melody: 'nightSky',
      goal: 'Real visual search: the brighter point sits among more company now, and the company drifts. Challenge comes from the looking itself — never from speed. A touch near it makes it answer.',
      watchFor: 'Systematic searching — eyes working across the screen — and the pause of success on the find.',
    },
  },
  'follow-the-star': {
    teen: {
      title: 'Follow Through the Field',
      melody: 'tideGlass',
      goal: 'The point travels its slow curve while dim company drifts around it — holding on to one moving thing among others. A touch near it makes it sound.',
      watchFor: 'Following that survives the distractions, or re-finding the target after losing it to one.',
    },
  },
  'familiar-faces': {
    teen: {
      title: 'Familiar Faces',
      melody: 'ember',
      goal: 'The people they love, one at a time, held long enough to really look. Faces are among the hardest and most rewarding things to see with CVI — and only your own photos are ever used. Add face photos in Settings to unlock.',
      watchFor: 'A change when a face appears versus a shape: stilling, brightening, vocalising — recognition wears many coats.',
      bridge: 'Best right before time with the real person: photo first, then the face itself, close and unhurried.',
    },
  },
  'bell-and-drum': {
    teen: {
      title: 'Two Tones',
      goal: 'Two contrasting voices take slow turns: a small bright tone, then a low warm one. Early sound discrimination — noticing that the two are different.',
      watchFor: 'Different reactions to the two sounds: a still, listening face for one, movement or vocalising for the other.',
    },
  },
};

/** Mechanical wording adaptation for bands without explicit copy overrides. */
export function adaptCopy(text: string, band: AgeBand): string {
  if (band === 'infant') return text;
  if (band === 'child') {
    return text
      .replace(/your baby's/gi, "your child's")
      .replace(/your baby/gi, 'your child')
      .replace(/\bbabies\b/gi, 'children')
      .replace(/\bbaby\b/gi, 'child');
  }
  return text
    .replace(/your baby's/gi, 'their')
    .replace(/your baby/gi, 'they')
    .replace(/\bbabies\b/gi, 'young people')
    .replace(/\bbaby\b/gi, 'young person');
}

/** Resolve a lesson for an age band: same behavior, band-appropriate skin. */
export function resolveLesson(spec: LessonSpec, band: AgeBand): LessonSpec {
  if (band === 'infant') return spec;
  const v = BAND_VARIANTS[spec.id]?.[band] ?? {};
  return {
    ...spec,
    title: v.title ?? spec.title,
    theme: v.theme ?? spec.theme,
    shape: v.shape ?? spec.shape,
    melody: v.melody ?? spec.melody,
    goal: v.goal ?? adaptCopy(spec.goal, band),
    watchFor: v.watchFor ?? adaptCopy(spec.watchFor, band),
    bridge: v.bridge ?? (spec.bridge ? adaptCopy(spec.bridge, band) : undefined),
  };
}

/** Plain-language phrases for UI copy, per band. */
export function bandNoun(band: AgeBand): string {
  return band === 'infant' ? 'your baby' : band === 'child' ? 'your child' : 'they';
}
