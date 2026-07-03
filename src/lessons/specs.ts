import type { LessonSpec } from '../lib/types';

/**
 * The infant lesson library (v1 scope: birth to ~18 months).
 *
 * Levels follow early CVI visual development:
 *   Level 1 — building visual attention: one target, plain dark field.
 *   Level 2 — integrating and tracking: slow movement, gentle choice, familiar things.
 * Hearing-first lessons (CR-5) make listening the goal in its own right.
 *
 * Colours are not baked into lessons: every target renders in the child's own
 * colour (PR-1), so "Rolling Ball" is a red ball for one baby and yellow for another.
 * Copy is for grown-ups; the child's screen never shows text.
 */
export const LESSONS: readonly LessonSpec[] = [
  /* ------------------------------- Level 1 ------------------------------- */
  {
    id: 'gentle-glow',
    title: 'Gentle Glow',
    level: 1,
    theme: 'Light',
    behavior: 'pulse',
    shape: 'orb',
    melody: 'brahms',
    interactive: false,
    goal: 'One soft light on a dark screen, breathing very slowly with a lullaby. The simplest place to begin: just noticing that something is there.',
    watchFor:
      'Going still or quiet, eyes widening, blinking, or slowly turning toward the screen. A look can arrive many seconds after the light appears — that pause is normal.',
  },
  {
    id: 'little-star',
    title: 'Little Star',
    level: 1,
    theme: 'Stars',
    behavior: 'twinkle',
    shape: 'star',
    melody: 'twinkle',
    interactive: false,
    goal: 'A single star shimmering very gently to its own song. A slightly livelier target than Gentle Glow, still on a plain dark field.',
    watchFor: 'Eyes settling on the star and staying a little longer each week.',
  },
  {
    id: 'drifting-light',
    title: 'Drifting Light',
    level: 1,
    theme: 'Light',
    behavior: 'driftAcross',
    shape: 'orb',
    melody: 'humSway',
    interactive: false,
    goal: 'A light drifts slowly from one side to the other — early practice at following with the eyes. If movement is switched off in settings, the light rests in one place instead.',
    watchFor:
      'Eyes or head following the light even part of the way, or finding it again after losing it. Losing and re-finding is real progress.',
  },
  {
    id: 'magic-touch',
    title: 'Magic Touch',
    level: 1,
    theme: 'Touch & light',
    behavior: 'causeEffect',
    shape: 'orb',
    melody: 'chime',
    interactive: true,
    goal: 'Cause and effect: a touch anywhere on the screen — or a switch press — makes the light bloom softly and sing. Any touch counts; nothing needs aiming.',
    watchFor:
      'Any arm movement toward the screen, a swipe or bat, then a pause to look at what happened. Hand-over-hand help is a lovely way to start.',
    bridge:
      'Off screen, offer the same game with a real object: a gentle shake of a soft rattle each time your baby reaches.',
  },
  {
    id: 'firefly',
    title: 'Firefly',
    level: 1,
    theme: 'Fireflies',
    behavior: 'appearSpots',
    shape: 'orb',
    melody: 'musicBox',
    interactive: false,
    goal: 'A small light rests, melts away, and reappears somewhere new. Practice at noticing and re-finding. It favours the part of the screen you chose in the field setting.',
    watchFor: 'Searching looks after the light fades, and finding it in its new spot.',
  },
  {
    id: 'raindrop',
    title: 'Raindrop',
    level: 1,
    theme: 'Rain',
    behavior: 'fallDrop',
    shape: 'drop',
    melody: 'plinks',
    interactive: false,
    goal: 'One drop of light slides slowly down the screen and lands with a soft plink. Gentle up-to-down tracking with a small, satisfying ending.',
    watchFor: 'Eyes riding the drop downward, or a blink or startle-free reaction to the plink.',
  },

  /* ------------------------------- Level 2 ------------------------------- */
  {
    id: 'star-path',
    title: 'Star Path',
    level: 2,
    theme: 'Stars',
    behavior: 'pathArc',
    shape: 'star',
    melody: 'twinkle',
    interactive: false,
    goal: 'The star now travels a slow, curved path — and with "sound follows the target" on, its song travels with it, joining looking and listening.',
    watchFor: 'Smoother following along the curve, or turning toward the side the song has moved to.',
  },
  {
    id: 'two-fireflies',
    title: 'Two Fireflies',
    level: 2,
    theme: 'Fireflies',
    behavior: 'inviteTwo',
    shape: 'orb',
    melody: 'musicBox',
    interactive: true,
    goal: 'Two resting lights. One at a time glows brighter and chimes, inviting a look — a first, gentle experience of choosing where to look. A touch anywhere makes the bright one answer.',
    watchFor: 'A look that moves to whichever firefly is glowing, even slowly.',
  },
  {
    id: 'rolling-ball',
    title: 'Rolling Ball',
    level: 2,
    theme: 'Familiar things',
    behavior: 'rollBounce',
    shape: 'ball',
    melody: 'row',
    interactive: true,
    goal: 'A simple ball rolls gently in, settles, and rests — a familiar everyday object as the target. A touch gives it a soft little bounce.',
    watchFor: 'Recognition looks: brightening when the ball rolls in, glancing where it settles.',
    bridge:
      'Afterwards, hand your baby a real ball in the same colour. Screen first, real thing next — that link is the whole point.',
  },
  {
    id: 'little-duck',
    title: 'Little Duck',
    level: 2,
    theme: 'Familiar things',
    behavior: 'glideAcross',
    shape: 'duck',
    melody: 'frere',
    interactive: false,
    goal: 'A little duck glides across as if on quiet water, pausing to bob in the middle. A familiar shape, slow movement, simple background.',
    watchFor: 'Following the duck across, or a smile of recognition at the pause.',
    bridge: 'A real bath duck in the same colour makes a perfect follow-up at bath time.',
  },
  {
    id: 'balloon',
    title: 'Balloon',
    level: 2,
    theme: 'Balloons',
    behavior: 'riseFloat',
    shape: 'balloon',
    melody: 'mary',
    interactive: true,
    goal: 'A balloon drifts slowly upward and away, then another follows. Rising movement is lovely practice for babies who notice the lower part of their view more — it starts where they see and travels outward. A touch makes it sway.',
    watchFor: 'Eyes lifting with the balloon a little further each time.',
  },
  {
    id: 'familiar-photo',
    title: 'A Familiar Face or Toy',
    level: 2,
    theme: 'Familiar things',
    behavior: 'photoDrift',
    shape: 'photo',
    melody: 'brahms',
    interactive: false,
    requiresPhoto: true,
    goal: 'Your own photo — a favourite toy or a familiar, loved face — fading gently in on a plain background. Familiar things are often the most motivating targets of all. Add a photo in Settings to unlock this lesson. Photos stay on this device only.',
    watchFor: 'A different quality of attention than for shapes: longer, warmer, more searching.',
    bridge: 'Show the real toy (or the real person!) right after the screen version.',
  },

  /* ------------------------- Level 3 · toward the world ------------------------- */
  {
    id: 'find-the-star',
    title: 'Find the Star',
    level: 3,
    theme: 'Stars',
    behavior: 'findAmong',
    shape: 'star',
    melody: 'musicBox',
    interactive: true,
    goal: 'One brighter star rests among a few dim companions — the first taste of finding a thing among other things. A touch near the star (or any switch press) makes it answer. The complexity setting decides how much company appears.',
    watchFor: 'Eyes moving between the shapes and settling on the bright one, even after a long think. Finding it slowly still counts as finding it.',
  },
  {
    id: 'find-your-photo',
    title: 'Find Your Photo',
    level: 3,
    theme: 'Familiar things',
    behavior: 'findAmong',
    shape: 'photo',
    melody: 'brahms',
    interactive: true,
    requiresPhoto: true,
    goal: 'Their own familiar thing — a favourite toy, a loved face — resting among a few dim shapes. Familiarity does the finding for them at first; that is the point. Add a photo in Settings to unlock.',
    watchFor: 'A quicker, warmer settle on the photo than on the shapes around it.',
    bridge: 'Play the same game in the room: the real toy among two other objects, offered slowly.',
  },
  {
    id: 'near-and-far',
    title: 'Near and Far',
    level: 3,
    theme: 'Light',
    behavior: 'nearFar',
    shape: 'orb',
    melody: 'humSway',
    interactive: false,
    goal: 'The light returns big, then smaller, then small — like something seen from across the room. Smaller sizes gently practise the beginnings of distance viewing.',
    watchFor: 'Whether the small appearances still earn a look, or only the big ones — a useful thing to notice, and only ever that.',
    bridge: 'Try the real-world version: show a favourite object close, then from across the room, unhurried.',
  },

  /* ---------------------- Level 4 · higher-order looking ---------------------- */
  {
    id: 'hidden-among-many',
    title: 'Hidden Among Many',
    level: 4,
    theme: 'Stars',
    behavior: 'searchClutter',
    shape: 'star',
    melody: 'musicBox',
    interactive: true,
    goal: 'Real visual search: the brighter star sits among more company now, and the company drifts. Challenge comes from the looking itself — never from speed. A touch near the star makes it answer.',
    watchFor: 'Systematic searching — eyes working across the screen — and the little pause of triumph on the find.',
  },
  {
    id: 'follow-the-star',
    title: 'Follow the Star',
    level: 4,
    theme: 'Stars',
    behavior: 'amongMoving',
    shape: 'star',
    melody: 'twinkle',
    interactive: true,
    goal: 'The star travels its slow curve while dim company drifts around it — holding on to one moving thing among others. A touch near the star makes it sing.',
    watchFor: 'Following that survives the distractions, or re-finding the star after losing it to one.',
  },
  {
    id: 'familiar-faces',
    title: 'Familiar Faces',
    level: 4,
    theme: 'Familiar things',
    behavior: 'facesFamiliar',
    shape: 'photo',
    melody: 'brahms',
    interactive: false,
    requiresPhoto: true,
    goal: 'The people they love, one at a time, held long enough to really look. Faces are one of the hardest and most rewarding things to see with CVI — and only your own photos are ever used. Add face photos in Settings to unlock.',
    watchFor: 'A change when a face appears versus a shape: stilling, brightening, vocalising — recognition wears many coats.',
    bridge: 'Best right before time with the real person: photo first, then the face itself, close and unhurried.',
  },

  /* ----------------------------- Hearing first ----------------------------- */
  {
    id: 'traveling-song',
    title: 'Traveling Song',
    level: 1,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'audioPan',
    shape: 'orb',
    melody: 'twinkle',
    interactive: false,
    goal: 'A listening lesson: the screen rests almost dark while a song drifts slowly from one side to the other. Listening is the goal here — looking is not required. Works best with the device propped up and its own speakers, not headphones.',
    watchFor: 'Going still to listen, eyes shifting, or the head turning toward the side the song has moved to.',
  },
  {
    id: 'bell-and-drum',
    title: 'Bell and Drum',
    level: 1,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'audioAlternate',
    shape: 'orb',
    melody: 'duet',
    interactive: false,
    goal: 'Two gentle voices take slow turns: a small bright bell, then a low warm drum. Early sound discrimination — noticing that the two are different.',
    watchFor: 'Different reactions to the two sounds: a still, listening face for one, a wiggle or vocalisation for the other.',
  },
] as const;

export function getLesson(id: string): LessonSpec | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** Default child queue when nothing is favorited yet. */
export const DEFAULT_LESSON_IDS = ['gentle-glow', 'little-star', 'drifting-light', 'magic-touch'];
