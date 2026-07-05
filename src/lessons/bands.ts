import type { AgeBand, BandVariant, LessonSpec } from '../lib/types';
import { LOCALE, type Locale } from '../lib/locale';

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
    child: { title: 'Lantern Glow', melody: 'lanternWaltz' },
    teen: {
      title: 'Ember',
      melody: 'ember',
      goal: 'One warm light on a dark screen, breathing very slowly with a low, calm line of music. The simplest place to begin: just noticing that something is there.',
      watchFor:
        'Going still or quiet, eyes widening, or turning toward the screen. A look can arrive many seconds after the light appears — that pause is part of CVI at any age.',
    },
  },
  'little-star': {
    child: { title: 'Wishing Star' },
    teen: {
      title: 'North Star',
      melody: 'nightSky',
      goal: 'A single star shimmering gently against the dark, with slow ambient tones. A slightly livelier target, still one thing on a plain field.',
      watchFor: 'Eyes settling on the star and holding a little longer over the weeks.',
    },
  },
  'drifting-light': {
    child: { title: 'Floating Lantern' },
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
    child: { melody: 'meadow' },
    teen: {
      title: 'Night Lights',
      melody: 'nightSky',
      goal: 'A small light rests, melts away, and reappears somewhere new — noticing and re-finding, tuned to the screen region you set.',
      watchFor: 'Searching looks after the light fades, and finding it in its new place.',
      bridge:
        'In a dim room, rest a small light in one place, cover it gently, and let it reappear somewhere new — slow, unhurried hide and seek.',
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
      bridge:
        'Glide a light or a meaningful object through one slow, smooth curve while humming a line — the same journey, held in your hand.',
    },
  },
  'two-fireflies': {
    teen: {
      title: 'Signals',
      melody: 'ember',
      goal: 'Two resting lights. One at a time brightens and sounds, inviting a look — a gentle experience of choosing where to look. A touch anywhere makes the bright one answer.',
      watchFor: 'A look that moves to whichever light is glowing, even slowly.',
      bridge:
        'Hold two small lights or objects a little apart and let one at a time "call" — a slow wiggle, a hum — and notice which one earns the look.',
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
      bridge:
        'Watch slow rising things together — steam from a mug, bubbles if they enjoy them — few, gentle, and unhurried.',
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
    child: { title: 'Star Hide-and-Seek', melody: 'meadow' },
    teen: {
      title: 'Find the Signal',
      melody: 'tideGlass',
      goal: 'One brighter point rests among a few dim companions — finding a thing among other things. A touch near it (or any switch press) makes it answer. The complexity setting decides how much company appears.',
      watchFor: 'Eyes moving between the shapes and settling on the bright one, even after a long think. Finding it slowly still counts.',
    },
  },
  'find-your-photo': {
    child: { title: 'Find Your Treasure' },
    teen: {
      title: 'Spot the Familiar',
      melody: 'ember',
      goal: 'Their own familiar thing — something they genuinely care about — resting among a few dim shapes. Familiarity does the finding at first; that is the point. Add a photo in Settings to unlock.',
      watchFor: 'A quicker, warmer settle on the photo than on the shapes around it.',
      bridge: 'Play the same game in the room: the real object among two others, offered slowly.',
    },
  },
  'near-and-far': {
    child: { title: 'Close and Far Away' },
    teen: {
      title: 'Near and Far',
      melody: 'nightSky',
      goal: 'The light returns large, then smaller, then small — like something seen from across a room. Smaller sizes gently work the beginnings of distance viewing.',
      watchFor: 'Whether the small appearances still earn a look, or only the large ones — a useful thing to notice, and only ever that.',
      bridge: 'Try the real-world version: a favourite object close, then from across the room, unhurried.',
    },
  },
  'hidden-among-many': {
    child: { title: 'Deep Hide-and-Seek', melody: 'meadow' },
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
  'wheres-the-song': {
    teen: {
      title: 'Find the Sound',
      goal: 'A listening game: sound calls gently from one side, then the other. When they turn toward it — even slightly — tap anywhere, and it answers from that same side. Best with the device propped up and its own speakers, or a speaker you can place.',
      watchFor: 'Stilling first, then a head-turn or eye-shift toward the calling side. Slow turning is still turning.',
      bridge: 'The real-world twin: speak softly from one side of them, then the other, and mark every turn.',
    },
  },
  'drum-and-tune': {
    teen: {
      title: 'Beat and Line',
      goal: 'Two musical characters take slow turns: a soft, steady beat, then a flowing line. Discrimination one step on from Two Tones — different kinds of sound, not just different notes.',
      watchFor: 'Different reactions to the two characters: still listening for one, movement or vocalising for the other.',
    },
  },
  'big-sound-little-sound': {
    teen: {
      title: 'Loud and Soft',
      goal: 'The same warm note returns quietly, then more fully — never sharply. Noticing louder and softer is a building block of listening, and of feeling settled around sound.',
      watchFor: 'A blink, a settle, or brightening when the fuller sound arrives — and whether the quiet one still earns attention.',
    },
  },
  'bell-and-drum': {
    teen: {
      title: 'Two Tones',
      goal: 'Two contrasting voices take slow turns: a small bright tone, then a low warm one. Early sound discrimination — noticing that the two are different.',
      watchFor: 'Different reactions to the two sounds: a still, listening face for one, movement or vocalising for the other.',
    },
  },
  'peekaboo-light': {
    child: { title: 'Peekaboo Lantern', melody: 'lanternWaltz' },
    teen: {
      title: 'Lighthouse',
      melody: 'tideGlass',
      goal: 'The light slides behind a dark headland, waits, sounds a low note — and returns in the very same place, like a lighthouse coming around. Practice at expecting: knowing where something will reappear, and being there to meet it. With movement off, the light hides in place instead of travelling.',
      watchFor: 'Eyes holding near the hiding place through the pause, or settling back there when the note sounds.',
      bridge:
        'The real-world twin: watch a slow, predictable coming-and-going together — a pedestrian light, headlights that sweep past and return, waves reaching and retreating.',
    },
  },
  'keep-the-light-singing': {
    teen: {
      title: 'Sustain',
      melody: 'ember',
      goal: 'A patient light that answers for exactly as long as a touch stays: rest a finger anywhere — or hold the switch — and it swells and hums. Let go, and it settles. Nothing needs aiming; letting go is part of the practice.',
      watchFor: 'Holding on purpose, releasing to check, holding again — contingency discovered, then tested.',
      bridge: 'Hum or play a note while their hand rests on yours, pausing gently when it lifts — cause and effect you can feel.',
    },
  },
  'reach-for-the-light': {
    teen: {
      title: 'Beacon',
      melody: 'ember',
      goal: 'One patient light, and an invitation: a touch on the light itself — or any switch press — makes it answer and bloom. The hit area is generous, and a miss only draws a gentle brightening. Looking first, touching second, at any speed.',
      watchFor: 'A look, then a reach — even with a long pause between, and even looking away while the hand travels. That split is a normal way to reach.',
      bridge: 'The same game with a real object they care about, at easy reach on a plain dark surface, in their own time.',
    },
  },
  'song-then-star': {
    teen: {
      title: 'Call, Then Light',
      melody: 'nightSky',
      goal: 'A slow call sounds from one side of the dark. Then quiet. Then, on that same side, a point of light fades gently in — the sound announces, the light arrives, never both at once. Listening and looking take turns instead of competing.',
      watchFor: 'A turn toward the call, then eyes arriving where the light appears — even long after it has faded in. The order matters more than the speed.',
      bridge: 'Speak softly from one side of them, wait a moment, then lean slowly into view on that same side: sound first, then the sight of you.',
    },
  },
  'find-your-colour': {
    child: { melody: 'meadow' },
    teen: {
      title: 'Colour Signal',
      melody: 'tideGlass',
      goal: 'Their colour rests among a few quiet lights in other colours — not brighter, simply theirs. Where Find the Signal is won by brightness, this one is won by colour, often the strongest anchor there is. A touch near it (or any switch press) makes it answer.',
      watchFor: 'Eyes moving between the lights and settling on their colour, even slowly — and whether that colour keeps winning across sessions.',
      bridge: 'Gather two or three things in their colour and a few in duller colours on a plain surface, and let their colour do the choosing.',
    },
  },
  'quiet-scene': {
    teen: {
      title: 'Night Harbour',
      shape: 'boat',
      melody: 'nightSky',
      goal: 'Two or three quiet shapes resting together — a boat on still water, the moon above — with nothing asked at all. An unhurried taste of more-than-one-thing staying calmly where it is. The complexity setting decides how much company appears.',
      watchFor: 'Eyes travelling from one thing to another and coming back — visiting the scene rather than holding one point.',
      bridge: 'Set two or three meaningful things together on a plain surface and name them slowly, touching each in turn. No questions, just company.',
    },
  },
  'star-by-star': {
    child: { melody: 'meadow' },
    teen: {
      title: 'Skyline',
      melody: 'nightSky',
      goal: 'A quiet row of lights. One after another, left to right, each takes its turn to glow — inviting the eyes to travel the row in order, the same sweep that shelves, signs, and lines of text ask for. A touch near the glowing light (or any switch press) makes it answer.',
      watchFor: 'Eyes arriving at the next light before it glows — the sweep becoming a habit rather than a surprise.',
      bridge: 'Line up three meaningful things left to right on a dark surface and visit each in turn together, always the same direction.',
    },
  },
};

/**
 * Mechanical wording adaptation for bands without an explicit copy override.
 *
 * This is an English-only convenience: age register in English can be reached
 * by swapping a few nouns and possessives. It does NOT generalise — other
 * languages carry grammatical gender, case, and register a find-replace cannot
 * reach — so for any non-English locale this is a no-op and the band must carry
 * explicit copy in BAND_VARIANTS instead. (Keep grammar out of logic; see the
 * i18n-readiness note in CLAUDE.md.)
 */
type CopyRule = readonly [pattern: RegExp, replacement: string];

const BAND_COPY_RULES: Partial<Record<Locale, Partial<Record<'child' | 'teen', readonly CopyRule[]>>>> = {
  en: {
    child: [
      [/your baby's/gi, "your child's"],
      [/your baby/gi, 'your child'],
      [/\bbabies\b/gi, 'children'],
      [/\bbaby\b/gi, 'child'],
    ],
    teen: [
      [/your baby's/gi, 'their'],
      [/your baby/gi, 'they'],
      [/\bbabies\b/gi, 'young people'],
      [/\bbaby\b/gi, 'young person'],
    ],
  },
};

export function adaptCopy(text: string, band: AgeBand): string {
  if (band === 'infant') return text;
  const rules = BAND_COPY_RULES[LOCALE]?.[band];
  if (!rules) return text; // non-English: the band must supply explicit copy
  return rules.reduce((out, [pattern, replacement]) => out.replace(pattern, replacement), text);
}

/** Resolve a lesson for an age band: same behavior, level, skill — band-appropriate skin. */
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
    bridge: v.bridge ?? adaptCopy(spec.bridge, band),
  };
}

// A word for the child, per band. Non-Partial so adding a locale is a compile
// error until it supplies its own nouns — a band noun must always exist.
const BAND_NOUNS: Record<Locale, Record<AgeBand, string>> = {
  en: { infant: 'your baby', child: 'your child', teen: 'they' },
};

/** Plain-language phrase for the child, per band. */
export function bandNoun(band: AgeBand): string {
  return BAND_NOUNS[LOCALE][band];
}
