# Sound design review: distraction, masking, and timing

Notes prompted by feedback that the sound can be distracting, and that in some lessons
(Raindrop especially) people expect the sound to track the picture and are thrown when it
doesn't. This document records what is actually happening in the audio today, how widely
each issue reaches across the lesson library, and a menu of directions we could take. It is
observations and options, not a committed plan. Requirement IDs refer to
`CVI-training-site-requirements-final.md`.

The framing that matters: for this population, looking and listening compete (PR-11, "the
senses take turns"). So "the sound is distracting" is not a polish issue, it works against
the visual goal of most lessons. That should bias us toward *less* sound and *more* control,
not just a nicer mix.

## How the audio is put together (recap)

All sound is synthesized live with the Web Audio API, no audio files (CR-2, TR-3), from one
`AudioEngine` in `src/engine/audio.ts`. The signal path is deliberately gentle:

> per-note filter + envelope → pan node → master gain (volume) → duck gain (FR-12) →
> compressor → speakers

Two kinds of sound share that path and the same synth voice set (`soft`, `musicbox`,
`warm`):

- **The melody**: a looping tune scheduled note by note (`pump()`), one per lesson via the
  `melody` field in `src/lessons/specs.ts`, re-skinned per age band in `src/lessons/bands.ts`.
- **Cues**: one-off event sounds (`playCue()` in `src/engine/audio.ts`), emitted by scenes
  (`src/engine/scenes.ts`) at moments like a tap answer (`chime`), a drop landing (`plink`),
  an invitation (`invite`), or a held-light hum (`hum`).

Three global sound modes gate all of this (`audioMode`, default `with`):

- `with`: the melody loops under the lesson, plus cues.
- `after`: no looping melody, only a short phrase played when the grown-up marks a look
  (FR-6b). Auto-selected during setup when a caregiver says sound pulls attention away
  (`src/lib/presets.ts`).
- `off`: silent.

The five listening lessons (CR-5) are cue-driven and never run a melody
(`CUE_DRIVEN_BEHAVIORS` in `specs.ts`), because a bed would bury the contrast they teach.

## What we observed

### 1. Feedback and music are hard to tell apart (the "same volume" report)

Melody notes and cue notes go through the same `note()` method at the same master level,
and there is **no ducking of the bed when a cue fires** (the `duck()` mechanism is wired
only to pause/observe and stop transitions, not to cues). Worse, the cue palette reuses the
melodies' own voices: `chime`, `invite`, `plink`, and `bell` are all the `musicbox` voice
in the same register as the `twinkle` / `musicBox` / `plinks` melodies. So a reward has
nothing to make it stand out from the tune it lands on.

**Scope: 14 of 30 lessons** play a bed and emit event sounds at once, and **13 of those 14**
have the cue in the same synth voice as the melody (the lone near-exception is Find Your
Photo: a `musicbox` chime over a `soft` Brahms). The other 16 escape it only because they
have no event sound to blur (11 are a pure tune, 5 are the bedless listening lessons). This
one is structural, not a few stray lessons.

### 2. Percussive backgrounds imply a mapping that isn't there (the "it doesn't mirror the picture" report)

Some beds are themselves sparse and plinky (`plinks`, and the `musicBox` pattern), which
invites the reading "each ping marks a thing on screen." The pings are actually a fixed
metronome, unrelated to the animation. Flowing tunes (Brahms, Twinkle, Frère, Mary, Row)
don't trigger this, they read correctly as ambient music.

**Scope: 8 of 30**, and three of those are severe, where the bed is note-for-note identical
to the lesson's own reward:

- **Raindrop**: the `plinks` bed (note 76 looping) is the same sound as the `plink` landing
  cue. At default settings a drop lands about once every ~22 s while the bed plinks every
  ~1.9 s, so roughly 11 of every 12 plinks heard mark nothing at all.
- **Magic Touch** and **Reach for the Light**: both loop the `chime` arpeggio (72-76-79) as
  the bed *and* fire the same `chime` as the tap reward. These are the two lessons most
  about cause and effect ("I made that happen"), and the reward is camouflaged inside a
  constant identical arpeggio.

(Firefly is a mild cousin: a plinky `musicBox` bed with no cue at all tied to a firefly, so
any felt correspondence is coincidence.)

### 3. In Raindrop, the sound lands after the picture (the "delay" report)

The drop falls with `easeInOutSine`, so it decelerates into the bottom, and the `plink` is
scheduled at the geometric endpoint (`u = 1`) in `fallDrop` (`src/engine/scenes.ts`). At
default settings the drop looks landed about 1.4 s before the plink sounds. A soft 30 ms
attack and a 30 ms scheduler lookahead add a little more onset softness.

**Scope: 1 of 30** for this specific "sound is late" shape, Raindrop is the only lesson that
fires a cue at the end of a decelerating arrival. Worth noting the opposite offset is common:
in tap-reward lessons the chime fires *at the tap* while the visual bloom ramps in slowly
(safety fades), so there the sound leads the picture by up to a second. "Audio and video
don't coincide" is general; only the late-sound version is Raindrop's alone.

### Further observations (a closer read of the engine)

A closer read of `src/engine/audio.ts` turned up a few more things, none as loud as the first
three, but worth recording.

- **The synthesis is bare, with no sense of space.** Every note is oscillator into lowpass
  into gain, and the only thing on the output is a compressor. There is no reverb or
  ambience, so the one-off stings (`chime`, `plink`) sound exposed and abrupt, closer to a UI
  beep than to music. This is the real substance behind "could the sound be nicer," see the
  fidelity section below.
- **The landing plink has a random pitch.** `playCue('plink')` picks note 76 or 79 with
  `Math.random()` (`audio.ts` around line 392). It is the one piece of nondeterminism in the
  audio path, and it means the drop's landing has no stable sonic identity, which feeds the
  Raindrop confusion. Easy to make fixed (or seed it).
- **Headroom is by convention, not enforced.** Loudness is kept safe only by low per-note
  peaks (~0.22) and few simultaneous voices, plus one gentle compressor shared by the melody
  and the cues (so a loud melody moment lightly pumps the cues, and the reverse). There is no
  brickwall limiter. Fine today, but it is the thing that would bite if we add voices (layered
  style, custom audio, or richer synthesis).
- **Volume is a linear gain.** `setVolume` sets `master.gain` linearly, but perceived loudness
  is roughly logarithmic, so the slider does most of its work in the bottom third and feels
  unresponsive near the top. Minor, but it matters more if we lower the default.
- **Minor robustness / tidiness.** The `pump()` scheduler has no catch-up clamp if its clock
  falls behind (largely masked because hiding the tab pauses and ducks). The cue path skips
  the `phraseBusy` guard and there is no voice cap, bounded in practice only by the 1500 ms
  reward cooldown on taps. And the `melody` field is inert as a bed on the five cue-driven
  listening lessons (it can only surface as an after-a-look phrase).
- **Panning is extra motion in the sound.** With `soundFollowsTarget` on, the whole bed slides
  and its filter sweeps continuously (FR-10). That is one more moving part competing for
  attention, the same category as the distraction we are trying to reduce.

## The whole library, by severity

| Tier | Lessons | What's wrong |
|---|---|---|
| **A. Severe: bed ≈ the reward** | Raindrop, Magic Touch, Reach for the Light | Bed is note-identical to the event sound. Raindrop also has the timing lag. |
| **B. Plinky bed + masking** | Peekaboo Light, Two Fireflies, Find the Star, Find Your Colour, Hidden Among Many, Star by Star | `musicBox` bed tempts a false mapping and the cue shares its voice and level. |
| **C. Masking only (flowing tune)** | Keep the Light Singing, Rolling Ball, Balloon, Follow the Star, Find Your Photo | Tune reads fine, but the cue still blends in level and voice. |
| **(edge) plinky, no cue** | Firefly | Sparse bed invites a mapping to fireflies that carry no sound. |
| **0. Clean** | Gentle Glow, Little Star, Drifting Light, Star Path, Little Duck, A Familiar Face or Toy, A Quiet Scene, Near and Far, Familiar Faces, Traveling Song | Bed only, nothing to confuse it with. |
| **L. Listening (already right)** | Bell and Drum, Where's the Song?, Drum and Tune, Big Sound, Little Sound, Song, Then Star | No bed; the two voices are deliberately contrasted. The model for how the rest could sound. |

This table is mechanical: it joins the lesson list in `src/lessons/specs.ts` against the
behavior-to-cue map in `src/engine/scenes.ts` and the melody-to-voice map in
`src/engine/melodies.ts`, so it can be re-derived if the lessons change.

## Options and directions

Roughly least to most invasive. They compose, and several are cheap. Given the distraction
feedback, the recommendation leans toward the ones that remove sound or hand control to the
grown-up, with the mix cleanups as support rather than the main event.

### Quick, low-risk wins

- **A. Duck the bed under every cue.** Wire the existing `duck()` into the cue path so the
  melody dips (say to ~0.3 for ~400 ms) whenever an event sound plays, then recovers. One
  small change in `Player.tsx` / `audio.ts`, no new sounds, and it directly answers "I can't
  tell the feedback from the music" across all 14 affected lessons. Highest leverage per line.
- **B. Stop looping reward motifs as a bed.** `chime` and `plinks` were written as reward
  stings, not tunes, and looping them is what creates the Tier A collisions. For the
  contingency lessons (Magic Touch, Reach for the Light) prefer **silence between rewards**,
  the reward becomes the only sound, which also strengthens the cause-and-effect point. Give
  Raindrop a soft sustained bed (or none) instead of a plink loop. Touches only three lessons'
  `melody` choices plus a small "no bed" path.
- **C. Fix Raindrop's timing.** Fire the `plink` at apparent touchdown (around 88-90% of the
  fall) rather than at `u = 1`, or ease the final approach less so the arrival is crisp.
  Localized to `fallDrop`. Fixing the random pitch (see above) belongs here too.

### Medium: give feedback its own identity

- **D. Reserve a distinct voice or register for cues.** Today cues borrow the melody voices.
  Pick one timbre (or a clearly separated octave) that means "this is a response to you," so
  feedback reads as feedback even when a bed is present. Changes the sonic identity, so worth
  a listen with a caregiver first.
- **E. Re-voice or replace the plinky beds.** Swap the `musicBox` bed on the Tier B lessons
  for a flowing, non-percussive bed (or none), so nothing on the background implies event
  marking. Content-only change in `specs.ts` / `bands.ts` and `melodies.ts`.

### Larger: change the defaults and the model

- **F. Make `quietPreferred` binding, not advisory.** The find and search lessons already
  carry a `quietPreferred` flag, but it only shows as guidance text. Have the player actually
  default those lessons to `after` or `off`. Directly reduces sound where looking is hardest.
- **G. Reconsider the global default.** Given the feedback, consider defaulting `audioMode`
  to `after` (or lowering the default `volume` below 0.6), so a bed is something a caregiver
  opts into rather than the out-of-the-box state. The setup flow already moves to `after`
  when sound seems to pull attention; this would extend that instinct to the default.
- **H. A single "calm sound" switch.** One control that strips all beds everywhere and keeps
  only the meaningful event sounds (or the inverse: gentle bed, no event stings). Easier for
  a grown-up to reason about than the current three-mode plus follow-target plus style set.

### Recommended sequence

1. **A + C** first: duck the bed under cues, fix Raindrop's cue time and random pitch. Small,
   safe, and they resolve the two loudest complaints (blur, Raindrop delay) immediately.
2. **B** next: stop looping the reward-motif beds, which clears all of Tier A.
3. Then decide the **defaults** question (F, then G) with a caregiver in the loop, since it
   changes what everyone hears on first run.
4. **D / E / H** are the larger identity and model changes, worth prototyping and listening
   to before committing.

## On making the melodies higher fidelity

A natural instinct is "make the music hi-fi." Worth separating what that means here.

**The audio is not low fidelity in the technical sense.** It is clean 32-bit float synthesis
at the device's native sample rate. There is no bit-crush, no low sample rate, no codec
artifact. What people usually mean by "hi-fi" for this app is *richer, warmer, less bare*,
which is a question of timbre and space, not sample quality.

There are two very different ways to get there, and they land very differently against our
constraints:

- **(i) Richer synthesis, still fully generated.** A small reverb or ambience send (a
  `ConvolverNode` with a *procedurally generated* impulse, or a light feedback-delay network),
  gentle detune or chorus for warmth, fuller multi-partial voices, and proper soft-attack
  ADSR. This stays inside "no audio files" (CR-2, TR-3) and the payload budget, and it is the
  on-brand path. A touch of space would make the bare stings feel less like beeps, which is a
  legitimate small win.
- **(ii) Sampled real instruments (piano, music box, strings).** This is what "hi-fi" often
  implies, and it is an architecture change, not a tweak. It **breaks CR-2 / TR-3** (no audio
  files), **breaks the payload budgets** (`scripts/check-budgets.mjs`, the zero-asset static
  bundle; CLAUDE.md says do not add binary lesson assets without extending the budget doc),
  and reintroduces the download / decode / stutter and offline concerns the synth approach
  exists to avoid. Only with explicit sign-off on those requirements.

**The tension to keep in view:** the presenting problem is that the sound is *distracting*,
and the design intent is deliberately minimal and sub-attention (PR-11). "Richer / lusher /
brighter" is *more present*, so it risks making the distraction worse, and reverb tails would
smear exactly the timing and onset cues Raindrop needs to be crisp. If we pursue fidelity at
all, it should be **warmth and space in service of calm**, not richness for its own sake.
Fidelity is not the lever for the distraction complaint; separation, fewer sounds, and
control (the options above) are.

**What any enrichment must respect (safety and requirements):**

- Keep every voice's attack at or above `SAFETY.MIN_AUDIO_ATTACK_S` (0.03 s). A crisp,
  percussive "hi-fi" transient would violate the gentle-onset intent (SR-2) even though the
  constant itself is about the floor. No sharp plucks.
- Tempo stays at or below `MAX_TEMPO_BPM` and pitches within `MELODY_NOTE_RANGE`; richer
  timbre does not touch these, so `melodies.test.ts` keeps passing.
- Generate any reverb impulse in code, never load one, or (ii)'s asset rules apply.
- Mind CPU on low-end tablets (convolution reverb is not free); the frame-drop diagnostic in
  the player is the place to watch it.
- Add a real limiter before the destination if voice count grows (see headroom note above).
- The synth internals (`note()`, `playCue()`) are not covered by tests today (jsdom has no Web
  Audio; `audio.test.ts` only exercises the pure `spatialParams`). If we touch them, add a
  couple of guards, for example asserting each voice's scheduled attack is at or above the
  floor, so the SR-2 analogue is enforced by a test and not just by a `Math.max` in the code.

## Safety and house rules for any of this

- Nothing here needs a raised ceiling. All of it lives at or below current limits (lower is
  always fine), and any new movement or envelope must still go through the kernel primitives,
  never hand-rolled (see CLAUDE.md).
- Keep every note's attack at or above `SAFETY.MIN_AUDIO_ATTACK_S` and every tune at or below
  `SAFETY.MAX_TEMPO_BPM`; `MELODY_NOTE_RANGE` and the tempo check are enforced by tests.
- Stay fully synthesized, no binary audio assets (the payload budgets in CI assume it).
- Ducking is a gain move on an existing node, so it is inside the safety model already; it
  changes loudness, not the visual flash budget.

## Open questions for the team

- Is a background bed worth keeping at all for the looking lessons, or is "meaningful sounds
  only" the calmer default we actually want?
- For Magic Touch and Reach for the Light, is silence-between-rewards the right feel, or a
  very soft sustained bed that ducks hard on the reward?
- Should `soundFollowsTarget` stay off by default (it currently is), given that panning music
  is one more moving part competing for attention?
