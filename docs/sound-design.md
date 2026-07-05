# Sound design: how the app uses sound

This records the sound model implemented in July 2026, after family feedback that the
sound could be distracting and sometimes seemed to promise things the picture didn't do.
The full diagnostic that led here (`sound-design-review.md`, now retired) lives in git
history; this is the durable part. Requirement IDs refer to
`CVI-training-site-requirements-final.md`.

## The two facts the design leans on

**For a child with CVI, looking and listening compete.** The requirements call it "the
senses take turns" (PR-11). Sound that plays while the child is working at looking is not
neutral decoration, it taxes the same attention the lesson is trying to grow. So the
design bias is fewer sounds, and sounds that mean something.

**For everyone in the room, sounds group by voice.** Two sounds in the same timbre and
register fuse into one stream, which is why a reward chime played in the bed's own music-box
voice at the bed's own level was reported as "I can't tell the feedback from the music".
Separation comes from giving feedback its own instrument and making the bed step aside,
not from playing feedback louder.

## The model

All sound is still synthesized live, no audio files (CR-2, TR-3). Two kinds of sound exist,
with different rules:

- **Beds** (`src/engine/melodies.ts`): looping background tunes, one per lesson via the
  `melody` field, re-skinned per age band. A bed must be a flowing melodic line. Sparse,
  percussive patterns are banned as beds because a ping every couple of seconds reads as
  though each ping marks something on screen, and a reward motif looped as a bed
  camouflages the actual reward. Beds route through their own gain bus.
- **Cues** (`CUES` in `src/engine/audio.ts`): one-off event sounds, plain data,
  deterministic, so the same moment always carries the same sound. The answer and
  attention cues (`chime`, `note`, `invite`, `plink`) speak in a reserved `glass` voice
  that no melody may use. The listening lessons' character sounds (bell, drum, call, beat,
  phrase, tones) keep their own contrasting voices; they never share the stage with a bed.

Rules that connect them:

1. **The bed steps back for every cue and voice label** (about 10 dB, recovering smoothly).
   Feedback always wins the moment without ever being loud.
2. **Contingency lessons are bedless.** Magic Touch and Reach for the Light play silence
   between rewards, and Keep the Light Singing rests quiet until a held touch keeps the
   light humming, so "I made that happen" is unmistakable (and the hold lesson's warm hum
   no longer had to fight a bed in its own voice). Mechanically all three joined
   `CUE_DRIVEN_BEHAVIORS` alongside the listening lessons.
3. **Where the looking is the work, the music waits.** The find/search lessons
   (`quietPreferred`) bind their preference: when the profile's sound mode is "with the
   visual", the player runs them the after-a-look way instead (quiet search, sound as the
   answer). "After" and "off" are honoured as chosen. See `effectiveAudioMode` in
   `src/lessons/specs.ts`; the lesson walk-through previews the same behavior.
4. **Sound and picture must agree.** Raindrop's plink fires at apparent touchdown (92% of
   the eased fall, where remaining travel is invisible) together with the ripple, instead
   of at the geometric endpoint over a second later.
5. **The volume slider is perceptual.** Loudness sense is roughly logarithmic, so the gain
   follows a squared taper; for any setting this only ever lowers the output.

## Where the rules are enforced

| Rule | Test |
|---|---|
| Cue pitches, offsets, durations, pans in the gentle band; plink is one fixed note | `tests/audio-cues.test.ts` |
| Every voice attack at or above `SAFETY.MIN_AUDIO_ATTACK_S` | `tests/audio-cues.test.ts` |
| `glass` reserved for feedback; no melody may use it | `tests/audio-cues.test.ts` |
| No reward-motif beds; beds carry a real melodic line (3+ pitches, every band) | `tests/audio-cues.test.ts` |
| Contingency lessons stay bedless; quiet binding honours "after"/"off" | `tests/audio-cues.test.ts` |
| Raindrop plink at apparent touchdown, ripple in step | `tests/scene.test.ts` |
| Tempos ≤ 84 BPM, melody pitches in range | `tests/melodies.test.ts` |

Safety posture: nothing here raised a ceiling. Ducking is a smoothed gain move on the bed
bus only; attacks stay at or above the 30 ms floor; everything remains synthesized inside
the payload budgets.

## Deliberately not done, and why

- **Reverb or richer "hi-fi" synthesis.** The presenting problem was distraction, and
  richness is more presence, not less. Reverb tails would also smear the onset timing that
  Raindrop's fix exists to sharpen. The `glass` voice instead rings slightly past its
  written length for a touch of air. Revisit only in service of calm.
- **Sampled instruments.** Breaks CR-2/TR-3 (no audio files) and the zero-asset payload
  budgets. Needs explicit sign-off on those requirements first.
- **Changing the global default mode to "after".** The lullaby-with-light pairing is the
  core of the Level 1 attention lessons, and the quiet binding now lands where looking is
  hardest. Whether quiet should go further is a live clinical question (see the review
  packet, question 10).
- **`soundFollowsTarget` stays off by default.** Panning music is one more moving thing;
  it remains an opt-in.

## Known rough edge

The Settings live preview's "Hear a moment" button loops the selected lesson's melody even
for bedless and quiet-bound lessons; it is a volume/texture sampler, not a lesson preview
(the walk-through page is the faithful one). Fine to revisit if it confuses anyone.
