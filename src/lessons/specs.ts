import type { AudioMode, Behavior, LessonSpec } from '../lib/types';

/**
 * The lesson library.
 *
 * Levels follow early CVI visual development:
 *   Level 1, building visual attention: one target, plain dark field.
 *   Level 2, integrating and tracking: slow movement, gentle choice,
 *             anticipation, first look-then-touch, familiar things.
 *   Level 3, toward the world: finding among a few, colour as the anchor,
 *             small restful scenes, the beginnings of distance.
 *   Level 4, higher-order looking: search, following through distraction,
 *             ordered sweeping, familiar faces.
 * Hearing-first lessons (CR-5) make listening the goal in its own right,
 * with their own gentle ladder (localizing → discriminating → sound-then-look).
 *
 * Colours are not baked into lessons: every target renders in the child's own
 * colour (PR-1), so "Rolling Ball" is a red ball for one baby and yellow for another.
 * Copy is for grown-ups; the child's screen never shows text.
 *
 * Per-lesson metadata for grown-up guidance (PT-10):
 *   skill, the one thing the lesson practises (band-neutral, describes
 *               the lesson, never the child, SR-7).
 *   stepBack / stepUp, a gentler / bolder neighbour, so "feels early" and
 *               "feels easy" both have somewhere obvious to go.
 *   bridge, every lesson carries a real-world follow-up (CR-4); screens
 *               are the doorway, not the destination.
 *   quietPreferred, find/search lessons where concurrent music competes
 *               with the looking (FR-6/PR-11). Binding: the player runs these
 *               in the after-a-look way whenever "with" is chosen, so the
 *               search happens in quiet and sound arrives as the answer
 *               (see effectiveAudioMode below).
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
    skill: 'noticing a light',
    stepUp: 'little-star',
    goal: 'One soft light on a dark screen, breathing very slowly with a lullaby. The simplest place to begin: just noticing that something is there.',
    watchFor:
      'Going still or quiet, eyes widening, blinking, or slowly turning toward the screen. A look can arrive many seconds after the light appears. That pause is normal.',
    bridge:
      'In a dim room, let one soft glow (a night light, a gentle lamp) be the only interesting thing for a little while, and keep it company together.',
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
    skill: 'holding a look',
    stepBack: 'gentle-glow',
    stepUp: 'drifting-light',
    goal: 'A single star shimmering very gently to its own song. A slightly livelier target than Gentle Glow, still on a plain dark field.',
    watchFor: 'Eyes settling on the star and staying a little longer each week.',
    bridge:
      'In a dark room, hold one small light very still and let it be found. A single soft spot of light on the wall works beautifully.',
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
    skill: 'following side to side',
    stepBack: 'little-star',
    stepUp: 'star-path',
    goal: 'A light drifts slowly from one side to the other, early practice at following with the eyes. If movement is switched off in settings, the light rests in one place instead.',
    watchFor:
      'Eyes or head following the light even part of the way, or finding it again after losing it. Losing and re-finding is real progress.',
    bridge:
      'Drift a torch spot slowly along a dark wall, one direction at a time, and let their eyes ride along. Losing and re-finding is part of the fun.',
  },
  {
    id: 'magic-touch',
    title: 'Magic Touch',
    level: 1,
    theme: 'Touch & light',
    behavior: 'causeEffect',
    shape: 'orb',
    melody: 'humSway',
    interactive: true,
    skill: 'making something happen',
    stepUp: 'keep-the-light-singing',
    goal: 'Cause and effect: a touch anywhere on the screen, or a switch press, makes the light bloom softly and sing. Any touch counts; nothing needs aiming.',
    watchFor:
      'Any arm movement toward the screen (a swipe or bat), then a pause to look at what happened. Hand-over-hand help is a lovely way to start.',
    bridge:
      'Off screen, offer the same game with a real object: a gentle shake of a soft rattle each time your baby reaches.',
  },
  {
    id: 'keep-the-light-singing',
    title: 'Keep the Light Singing',
    level: 1,
    theme: 'Touch & light',
    behavior: 'holdGlow',
    shape: 'orb',
    melody: 'humSway',
    interactive: true,
    skill: 'keeping something going',
    stepBack: 'magic-touch',
    stepUp: 'reach-for-the-light',
    goal: 'A patient light that answers for exactly as long as a hand stays: rest a finger anywhere on the screen, or hold the switch, and the light swells and softly sings. Let go, and it settles back to its quiet glow. Nothing needs aiming, and letting go is part of the game.',
    watchFor:
      'The dawning of "I am doing this": holding on purpose, letting go to check, holding again. Even a few seconds of steady touch is a triumph.',
    bridge:
      'The skin-to-skin twin: hum while their hand rests on yours, and pause gently when it lifts. The same promise, warmer.',
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
    skill: 're-finding after it moves',
    stepBack: 'little-star',
    stepUp: 'peekaboo-light',
    goal: 'A small light rests, melts away, and reappears somewhere new. Practice at noticing and re-finding. It favours the part of the screen you chose in the field setting.',
    watchFor: 'Searching looks after the light fades, and finding it in its new spot.',
    bridge:
      'In a dim blanket den, rest a small light in one spot, cover it gently with your hand, and let it appear somewhere new, slow hide and seek.',
  },
  {
    id: 'raindrop',
    title: 'Raindrop',
    level: 1,
    theme: 'Rain',
    behavior: 'fallDrop',
    shape: 'drop',
    melody: 'rainfall',
    interactive: false,
    skill: 'following downward',
    stepBack: 'drifting-light',
    stepUp: 'balloon',
    goal: 'One drop of light slides slowly down the screen and lands with a soft plink. Gentle up-to-down tracking with a small, satisfying ending.',
    watchFor: 'Eyes riding the drop downward, or a blink or startle-free reaction to the plink.',
    bridge:
      'On a rainy day, pick one drop at the top of the window and ride it down the glass together, a fingertip leading the way.',
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
    skill: 'following a curved path',
    stepBack: 'drifting-light',
    stepUp: 'follow-the-star',
    goal: 'The star now travels a slow, curved path, and with "sound follows the target" on, its song travels with it, joining looking and listening.',
    watchFor: 'Smoother following along the curve, or turning toward the side the song has moved to.',
    bridge:
      'Glide a favourite toy through the air in one slow, smooth curve while humming its little tune, the same journey, held in your hand.',
  },
  {
    id: 'peekaboo-light',
    title: 'Peekaboo Light',
    level: 2,
    theme: 'Light',
    behavior: 'hideReveal',
    shape: 'orb',
    melody: 'musicBox',
    interactive: false,
    skill: 'expecting what comes next',
    stepBack: 'firefly',
    stepUp: 'find-the-star',
    goal: 'The light slips gently behind a dark hill, waits, gives a little musical wink, and returns in the very same place. The waiting is the lesson: learning that something will come back, and watching for it. With movement off, the light hides in place instead of travelling.',
    watchFor:
      'Eyes staying near the hiding place through the pause, brightening at the return, or a wiggle of anticipation after the little note.',
    bridge:
      'Real peekaboo, slowly: hide your face behind a cloth, wait a beat, and come back with a soft "boo". The pause before the return is where the magic lives.',
  },
  {
    id: 'reach-for-the-light',
    title: 'Reach for the Light',
    level: 2,
    theme: 'Touch & light',
    behavior: 'reachTouch',
    shape: 'orb',
    melody: 'humSway',
    interactive: true,
    skill: 'looking, then touching',
    stepBack: 'keep-the-light-singing',
    stepUp: 'find-the-star',
    goal: 'One patient light, and a new invitation: a touch on the light itself, or any switch press, makes it sing and bloom. The hit area is huge and forgiving, and a miss only draws a gentle brightening. Looking first, touching second is the whole game, at any speed.',
    watchFor:
      'A look, then a reach, even with a long pause between, and even looking away while the hand travels. That split is a normal way to reach, not a miss.',
    bridge:
      'Offer a favourite thing at easy reach on a plain dark cloth and let the reach arrive in its own time, no hurrying, no aiming needed.',
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
    skill: 'choosing where to look',
    stepBack: 'firefly',
    stepUp: 'find-the-star',
    goal: 'Two resting lights. One at a time glows brighter and chimes, inviting a look, a first, gentle experience of choosing where to look. A touch anywhere makes the bright one answer.',
    watchFor: 'A look that moves to whichever firefly is glowing, even slowly.',
    bridge:
      'Hold two soft toys a little apart and let one at a time do a tiny dance with a hum. Which one earns the look?',
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
    skill: 'greeting a familiar thing',
    stepBack: 'magic-touch',
    stepUp: 'quiet-scene',
    goal: 'A simple ball rolls gently in, settles, and rests, a familiar everyday object as the target. A touch gives it a soft little bounce.',
    watchFor: 'Recognition looks: brightening when the ball rolls in, glancing where it settles.',
    bridge:
      'Afterwards, hand your baby a real ball in the same colour. Screen first, real thing next. That link is the whole point.',
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
    skill: 'following a familiar thing',
    stepBack: 'drifting-light',
    stepUp: 'quiet-scene',
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
    skill: 'lifting the gaze',
    stepBack: 'raindrop',
    stepUp: 'near-and-far',
    goal: 'A balloon drifts slowly upward and away, then another follows. Rising movement is lovely practice for babies who notice the lower part of their view more. It starts where they see and travels outward. A touch makes it sway.',
    watchFor: 'Eyes lifting with the balloon a little further each time.',
    bridge:
      'Blow bubbles or float a real balloon upward, slow and few. Rising things invite the eyes to lift and travel.',
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
    skill: 'warming to a familiar thing',
    stepBack: 'gentle-glow',
    stepUp: 'find-your-photo',
    goal: 'Your own photo (a favourite toy, or a familiar, loved face) fading gently in on a plain background. Familiar things are often the most motivating targets of all. Add a photo in Settings to unlock this lesson. Photos stay on this device only.',
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
    skill: 'finding one among a few',
    stepBack: 'two-fireflies',
    stepUp: 'find-your-colour',
    quietPreferred: true,
    goal: 'One brighter star rests among a few dim companions, the first taste of finding a thing among other things. A touch near the star (or any switch press) makes it answer. The complexity setting decides how much company appears.',
    watchFor:
      'Eyes moving between the shapes and settling on the bright one, even after a long think. Finding it slowly still counts as finding it.',
    bridge:
      'Rest a favourite thing among two or three duller things on a plain dark cloth, and give the finding all the time it wants.',
  },
  {
    id: 'find-your-colour',
    title: 'Find Your Colour',
    level: 3,
    theme: 'Colour',
    behavior: 'findColor',
    shape: 'orb',
    melody: 'musicBox',
    interactive: true,
    skill: 'letting colour do the finding',
    stepBack: 'find-the-star',
    stepUp: 'hidden-among-many',
    quietPreferred: true,
    goal: 'Their own colour rests among a few quiet lights in other colours, not brighter, simply theirs. Where Find the Star is won by brightness, this one is won by colour, often the strongest anchor there is. A touch near it (or any switch press) makes it answer.',
    watchFor:
      'Eyes moving between the lights and settling on their colour, even slowly, and whether that colour keeps winning across sessions.',
    bridge:
      'Gather two or three things in their colour and a few in duller colours on a plain surface, and let their colour do the choosing.',
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
    skill: 'finding a familiar thing',
    stepBack: 'familiar-photo',
    stepUp: 'familiar-faces',
    quietPreferred: true,
    goal: 'Their own familiar thing (a favourite toy, a loved face) resting among a few dim shapes. Familiarity does the finding for them at first; that is the point. Add a photo in Settings to unlock.',
    watchFor: 'A quicker, warmer settle on the photo than on the shapes around it.',
    bridge: 'Play the same game in the room: the real toy among two other objects, offered slowly.',
  },
  {
    id: 'quiet-scene',
    title: 'A Quiet Scene',
    level: 3,
    theme: 'Familiar things',
    behavior: 'restingScene',
    shape: 'duck',
    melody: 'brahms',
    interactive: false,
    skill: 'resting with a small scene',
    stepBack: 'little-duck',
    stepUp: 'hidden-among-many',
    goal: 'Two or three familiar friends resting together (the duck on its water, a ball beside it, a star above), with nothing asked at all. A first, unhurried taste of more-than-one-thing staying quietly where it is. The complexity setting decides how much company appears.',
    watchFor:
      'Eyes travelling from one thing to another and coming back, visiting the scene rather than holding one point.',
    bridge:
      'Set two or three familiar things together on a plain surface and name them slowly, touching each in turn. No questions, just company.',
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
    skill: 'noticing at a distance',
    stepBack: 'little-star',
    goal: 'The light returns big, then smaller, then small, like something seen from across the room. Smaller sizes gently practise the beginnings of distance viewing.',
    watchFor:
      'Whether the small appearances still earn a look, or only the big ones. A useful thing to notice, and only ever that.',
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
    skill: 'searching among many',
    stepBack: 'find-the-star',
    stepUp: 'follow-the-star',
    quietPreferred: true,
    goal: 'Real visual search: the brighter star sits among more company now, and the company drifts. Challenge comes from the looking itself, never from speed. A touch near the star makes it answer.',
    watchFor:
      'Systematic searching, eyes working across the screen, and the little pause of triumph on the find.',
    bridge:
      'The room version: a favourite thing resting among a small crowd of others on the floor. Finding it slowly is the whole game.',
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
    skill: 'following through distraction',
    stepBack: 'star-path',
    quietPreferred: true,
    goal: 'The star travels its slow curve while dim company drifts around it, holding on to one moving thing among others. A touch near the star makes it sing.',
    watchFor: 'Following that survives the distractions, or re-finding the star after losing it to one.',
    bridge:
      'Out in the world, keep company with one slow-moving thing together (a person crossing the room, a cat on its rounds), and re-find it whenever it slips away.',
  },
  {
    id: 'star-by-star',
    title: 'Star by Star',
    level: 4,
    theme: 'Stars',
    behavior: 'sweepRow',
    shape: 'star',
    melody: 'musicBox',
    interactive: true,
    skill: 'sweeping across in order',
    stepBack: 'find-the-star',
    quietPreferred: true,
    goal: 'A quiet row of stars. One after another, left to right, each takes its turn to glow, inviting the eyes to travel the row in order, the same gentle sweep that finding things on a shelf (and one day reading) asks for. A touch near the glowing star (or any switch press) makes it answer.',
    watchFor:
      'Eyes beginning to arrive at the next star before it glows, the sweep becoming a habit rather than a surprise.',
    bridge:
      'Line up three favourite things left to right on a dark cloth and visit each in turn together, always the same direction, unhurried.',
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
    skill: 'really looking at faces',
    stepBack: 'find-your-photo',
    goal: 'The people they love, one at a time, held long enough to really look. Faces are one of the hardest and most rewarding things to see with CVI, and only your own photos are ever used. Add face photos in Settings to unlock.',
    watchFor:
      'A change when a face appears versus a shape: stilling, brightening, vocalising. Recognition wears many coats.',
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
    skill: 'listening to where sound goes',
    stepUp: 'wheres-the-song',
    goal: 'A listening lesson: the screen rests almost dark while a song drifts slowly from one side to the other. Listening is the goal here; looking is not required. Works best with the device propped up and its own speakers, not headphones.',
    watchFor: 'Going still to listen, eyes shifting, or the head turning toward the side the song has moved to.',
    bridge:
      'Walk slowly around them while humming the same soft tune, and let the song travel the room the way it travels the speakers.',
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
    skill: 'telling two sounds apart',
    stepUp: 'drum-and-tune',
    goal: 'Two gentle voices take slow turns: a small bright bell, then a low warm drum. Early sound discrimination, noticing that the two are different.',
    watchFor:
      'Different reactions to the two sounds: a still, listening face for one, a wiggle or vocalisation for the other.',
    bridge:
      'Play the two voices live: a gentle tap on a glass, then a soft pat on a cushion, one at a time, with room to breathe between.',
  },
  {
    id: 'wheres-the-song',
    title: "Where's the Song?",
    level: 1,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'soundSeek',
    shape: 'orb',
    melody: 'humSway',
    interactive: true,
    skill: 'turning toward sound',
    stepBack: 'traveling-song',
    stepUp: 'song-then-star',
    goal: 'A listening game: a little song calls gently from one side, then the other. When your baby turns toward it, even slightly, tap anywhere, and the song answers happily from that same side. Best with the device propped up and its own speakers, or a speaker you can place.',
    watchFor: 'Stilling first, then a head-turn or eye-shift toward the calling side. Slow turning is still turning.',
    bridge:
      'The real-world twin: call their name softly from one side of them, then the other, and celebrate every turn.',
  },
  {
    id: 'drum-and-tune',
    title: 'Drum and Tune',
    level: 1,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'rhythmMelody',
    shape: 'orb',
    melody: 'duet',
    interactive: false,
    skill: 'telling kinds of sound apart',
    stepBack: 'bell-and-drum',
    stepUp: 'big-sound-little-sound',
    goal: 'Two musical characters take slow turns: a soft, steady drum pattern, then a little flowing tune. Discrimination one step on from Bell and Drum, different kinds of sound, not just different notes.',
    watchFor:
      'Different reactions to the two characters: still listening for one, wiggles or little sounds for the other.',
    bridge:
      'Take turns being the drum, a slow pat-pat on the table, and the tune, a little hum. The same two characters, this time from you.',
  },
  {
    id: 'big-sound-little-sound',
    title: 'Big Sound, Little Sound',
    level: 1,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'loudSoft',
    shape: 'orb',
    melody: 'humSway',
    interactive: false,
    skill: 'noticing louder and softer',
    stepBack: 'bell-and-drum',
    goal: 'The same warm note returns quietly, then more fully, never sharply. Noticing louder and softer is a small building block of listening, and of feeling safe with sound.',
    watchFor:
      'A blink, a settle, or brightening when the fuller sound arrives, and whether the quiet one still earns attention.',
    bridge:
      'Hum one warm note quietly, then a little more fully, in everyday moments, louder and softer from the voice they know best.',
  },
  {
    id: 'song-then-star',
    title: 'Song, Then Star',
    level: 2,
    theme: 'Listening',
    hearingFirst: true,
    behavior: 'soundThenLight',
    shape: 'star',
    melody: 'twinkle',
    interactive: false,
    skill: 'listening, then looking',
    stepBack: 'wheres-the-song',
    stepUp: 'star-path',
    goal: 'A little song calls from one side of the dark. Then quiet. Then, on that same side, a star fades gently in, the sound announces, the light arrives, never both at once. Listening and looking take turns instead of competing.',
    watchFor:
      'A turn toward the song, then eyes arriving where the star appears, even long after it has faded in. The order matters more than the speed.',
    bridge:
      'Call softly from one side of them, wait a moment, then lean slowly into view on that same side: sound first, then the sight of you.',
  },
] as const;

export function getLesson(id: string): LessonSpec | undefined {
  return LESSONS.find((l) => l.id === id);
}

/**
 * Behaviors whose sound arrives entirely through scene cues, the player
 * must not run a looping melody underneath them. Two families live here:
 * the listening lessons, where a bed would bury the very contrast or
 * localization they exist to teach, and the contingency lessons
 * (cause-and-effect, reach, hold-to-sustain), where quiet between answers
 * makes the answer unmistakably the child's own doing (FR-9/PR-11). A bed
 * looping the same notes as the reward had camouflaged the one sound that
 * mattered, and the hold lesson's bed shared its hum's warm voice.
 * These lessons' `melody` never loops in a session; it only feeds the
 * Settings sampler ("Hear a moment"), so tune it there, not here.
 */
export const CUE_DRIVEN_BEHAVIORS: ReadonlySet<Behavior> = new Set<Behavior>([
  'audioAlternate',
  'soundSeek',
  'rhythmMelody',
  'loudSoft',
  'soundThenLight',
  'causeEffect',
  'reachTouch',
  'holdGlow',
]);

/**
 * FR-6/PR-11, how the chosen sound mode lands on a given lesson. In the
 * find/search lessons (quietPreferred) the looking itself is the work and
 * concurrent music competes with it, so "with the visual" plays those the
 * after-a-look way instead: quiet while searching, sound as the answer to a
 * touch. The quieter choices ("after", "off") are always honoured as chosen.
 */
export function effectiveAudioMode(mode: AudioMode, spec: LessonSpec): AudioMode {
  return mode === 'with' && spec.quietPreferred ? 'after' : mode;
}

/**
 * How much of a scene's pan reaches the cue that plays it (FR-10/CR-5).
 * The hearing-first lessons ARE localization, so their calls go out at full
 * strength: the side is the content, and softened pans wash out on real
 * speakers. Everywhere else the answer leans only gently toward the target;
 * feedback should agree with the picture, not shout from the edge of the room.
 */
export function cuePan(spec: LessonSpec, scenePan: number): number {
  return scenePan * (spec.hearingFirst ? 1 : 0.6);
}

/**
 * Behaviors driven by pressed *intervals* rather than discrete taps: the
 * player feeds them touch-down→up spans (and held switches), and the kernel's
 * slew-limited holdEnvelope turns any press pattern into a calm swell.
 */
export const HOLD_DRIVEN_BEHAVIORS: ReadonlySet<Behavior> = new Set<Behavior>(['holdGlow']);

/** Default child queue when nothing is favorited yet. */
export const DEFAULT_LESSON_IDS = ['gentle-glow', 'little-star', 'drifting-light', 'magic-touch'];
