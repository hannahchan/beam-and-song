# Beam and Song — clinical review packet

*For vision professionals, CVI specialists, low-vision therapists, and early-intervention professionals.*
*Prepared July 2026 · covers the full current build — Levels 1–4 across three age bands,
listening lessons, and per-lesson guidance — plus what remains planned (see ROADMAP.md).*

Thank you for looking at this. Beam and Song is a free, static web app offering short,
highly tunable light-and-song lessons for children with CVI, built as a **companion to
professional care, never a programme or assessment**. Before we recommend it to any
family, we want professional eyes on the content, the copy, and the safety reasoning.
Nothing in this packet assumes you'll be gentle — critical findings are the valuable ones.

## 1. What to review (in priority order)

1. **Safety reasoning** (§3 below) — are the assumptions sound for a seizure-prone population?
2. **Lesson content & progression** — do the activities match CVI practice at each level
   (attention → anticipation and reach → finding among company → search, sweep, faces)?
   Are any counterproductive for some children?
3. **Readiness cues** — each lesson's "what to watch for" and the Guide's
   "moving up, stepping back" section. Are these observations the right ones to teach a parent?
4. **The guided setup** — five questions recommending a starting preset. Would a newly
   diagnosed family be steered somewhere sensible? Somewhere harmful?
5. **Copy and framing** — the app claims "companion, not curriculum" everywhere.
   Does any wording drift into instruction, assessment, or false reassurance?
6. **The glow question** — glow defaults on (level 2 of 3) with copy noting light-gazing
   concerns and a fully-off setting. Is that the right default and the right framing?

## 2. How to review

- Live site: (deploy URL here) — works on any tablet/laptop; nothing installs, no data leaves the device.
- The child flow: tap **Start** → a lesson tile → watch a full session end in the "rest" screen.
- The grown-up area: **For grown-ups** → hold the button (or tap "two") → explore
  Lessons, Settings, Notes, and the Guide. Try the guided setup with an imagined child.
- **The quickest full pass:** Lessons → "Walk through every lesson, one after another" plays the
  whole library on a single page (buttons or arrow keys, optional slideshow and sound), using the
  active child's settings and age band — switch the band in Settings to review all three renderings.
- Please record findings in `clinical-feedback.md` format (one finding per row) or
  however is easiest for you — email/voice notes welcome.

## 3. Safety approach — the part we most want challenged

Seizure disorders are common alongside CVI, so the app enforces, in code, on every
lesson at every setting:

| Constraint | Value we enforce | Reference point |
|---|---|---|
| Periodic modulation (pulse/twinkle/bob) | ≤ 0.5 Hz | risk band starts ≈ 3 Hz (WCAG 2.3.1 / ISO 9241-391) |
| Any appearance/disappearance/change | eased fade ≥ 500 ms — no cuts | — |
| Luminance swing in any 0.5 s window | ≤ 0.18 (relative luminance, whole screen) | WCAG "general flash" = opposing swings ≥ 0.10 |
| Opposing luminance swings ("flash pairs") | ≤ 1 per second | WCAG allows 3/s |
| Saturated-red area transitions | zero | WCAG red-flash |
| Whole-screen relative luminance | ≤ 0.8 | dark-first design |
| Reward re-trigger (tap spam) | ≥ 1.5 s cooldown | — |
| Patterns (stripes/checks/gratings) | none exist anywhere | pattern-sensitivity literature |
| Music tempo | ≤ 84 BPM, soft attacks ≥ 30 ms | comfort, not seizure-driven |

These are verified by an automated suite that simulates every lesson frame-by-frame
(60 fps) at the most extreme settings a caregiver can reach, including button-mashing on
interactive lessons, and measures the resulting luminance timeline. The suite has
rejected designs repeatedly during development — most recently five over-bright reward
blooms in a single content round — which we take as evidence it has teeth.

**Assumptions we'd like challenged:**
- Whole-screen average luminance is our metric; we don't model localized retinal area
  beyond target size. Is that adequate at tablet viewing distances of 30–50 cm?
- Glow halos are counted at their gradient-weighted alpha (~0.18 of the halo disc).
- User photos: we measure each photo's actual luminance at import and bound fades accordingly.
- We treat ≤ 0.5 Hz periodic modulation as categorically safe. Any reason to go lower?

## 4. Current lesson inventory (infant-band titles; every lesson re-skins for child and teen bands)

The "practises" phrases below appear verbatim on the lesson cards; each card also
names a gentler and a bolder neighbour lesson, and every lesson carries an off-screen
real-object bridge (screen first, real thing next).

| Lesson | Level | Practises | Interactive |
|---|---|---|---|
| Gentle Glow | 1 | noticing a light | – |
| Little Star | 1 | holding a look | – |
| Drifting Light | 1 | following side to side | – |
| Magic Touch | 1 | making something happen | tap/switch |
| Firefly | 1 | re-finding after it moves | – |
| Raindrop | 1 | following downward | – |
| Star Path | 2 | following a curved path | – |
| Peekaboo Light | 2 | expecting what comes next | – |
| Reach for the Light | 2 | looking, then touching | tap/switch |
| Two Fireflies | 2 | choosing where to look | tap/switch |
| Rolling Ball | 2 | greeting a familiar thing | tap/switch |
| Little Duck | 2 | following a familiar thing | – |
| Balloon | 2 | lifting the gaze | tap/switch |
| A Familiar Face or Toy | 2 | warming to a familiar thing | – |
| Find the Star | 3 | finding one among a few | tap/switch |
| Find Your Colour | 3 | letting colour do the finding | tap/switch |
| Find Your Photo | 3 | finding a familiar thing | tap/switch |
| A Quiet Scene | 3 | resting with a small scene | – |
| Near and Far | 3 | noticing at a distance | – |
| Hidden Among Many | 4 | searching among many | tap/switch |
| Follow the Star | 4 | following through distraction | tap/switch |
| Star by Star | 4 | sweeping across in order | tap/switch |
| Familiar Faces | 4 | really looking at faces | – |
| Traveling Song | 1 (hearing) | listening to where sound goes | – |
| Bell and Drum | 1 (hearing) | telling two sounds apart | – |
| Where's the Song? | 1 (hearing) | turning toward sound | tap marks a turn |
| Drum and Tune | 1 (hearing) | telling kinds of sound apart | – |
| Big Sound, Little Sound | 1 (hearing) | noticing louder and softer | – |
| Song, Then Star | 2 (hearing) | listening, then looking | – |

Personalization axes: colour, background, movement+speed, complexity (1 object → subtle
texture), visual-field bias (direction + strength), pace/latency, size, glow (off→strong),
brightness, sound mode (**with** / **after a look** / **off**), volume, single/layered,
sound-follows-target, haptics, session length (2–8 min).

## 5. Specific questions

1. Are red/yellow the right default colour emphasis, presented as changeable?
2. Default session length is 4 minutes with a wind-down "rest moon". Right ballpark for infants?
3. The "after a look" mode has the *parent* tap to reward a look. Is that coaching a
   useful skill, or does it risk mis-timed reinforcement?
4. Two Fireflies invites a gaze shift roughly every 8–14 s (pace-dependent). Too fast? Too slow?
5. The readiness cues deliberately avoid timelines ("after several relaxed sessions").
   Should they be even more conservative?
6. Field bias: "strong" keeps ~100% of targets in the favoured region, "gentle" ~75%.
   Clinically sensible split?
7. Is there anything here that could *reinforce* light-gazing, beyond the glow control
   we already expose and caveat?
8. The planned expansion (ROADMAP.md): age bands, then Levels 3–4 (visual search,
   crowding, faces via family photos). Any red flags before we build?
9. What's missing that you'd actually use with a client family?
10. **Sound during searching.** The find/search lessons now carry a card note suggesting
    the "after a look" or "off" sound modes (sensory-competition reasoning: Roman-Lantzy's
    distance-learning guidance, CVI Scotland's "eyes or ears", Pilling 2022). Should quiet
    go further and become the *default* for those lessons — or for the earliest preset —
    in an app whose identity is light *and* song? We deliberately left defaults unchanged
    pending your view.
11. **Peekaboo timing.** Peekaboo Light hides the target for ~1.2× the child's hold
    setting and gives a small musical cue ~0.7 s before the return. Is a pre-cue right at
    all (it pairs sound with an upcoming visual), and is the hidden window sensible?
12. **The ordered sweep.** Star by Star always runs left → right, framed as pre-literacy
    scanning practice. Should direction be configurable (e.g., right-to-left scripts), and
    is an always-same-direction sweep appropriate at Level 4?
13. **Colour company.** Find Your Colour surrounds the child's colour with similar-brightness
    lights in a single muted hue from the opposite temperature family (warm target → slate
    company, cool target → clay company). Is that a fair first colour-discrimination step?
14. **The shunt note.** The Guide's setup section now cautions families of children with
    programmable shunt valves to ask their medical team about tablet magnets. Is the wording
    right — informative without alarm?

## 6. What this app never does

No diagnosis, scoring, grading, or normative comparison; no clinical terminology aimed at
families; no data collection (everything stays in the device's browser); no claims of
treatment effect. If any part of the experience feels like it breaks this, that's a
priority-one finding.
