# Beam and Song — clinical review packet

*For TVIs, CVI specialists, low-vision therapists, and early-intervention professionals.*
*Prepared July 2026 · review of v1 (infant scope) and the planned expansion (see ROADMAP.md).*

Thank you for looking at this. Beam and Song is a free, static web app offering short,
highly tunable light-and-song lessons for children with CVI, built as a **companion to
professional care, never a programme or assessment**. Before we recommend it to any
family, we want professional eyes on the content, the copy, and the safety reasoning.
Nothing in this packet assumes you'll be gentle — critical findings are the valuable ones.

## 1. What to review (in priority order)

1. **Safety reasoning** (§3 below) — are the assumptions sound for a seizure-prone population?
2. **Lesson content & progression** — do the Level 1/2 activities match early CVI practice?
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
interactive lessons, and measures the resulting luminance timeline. The suite rejected
four designs during development, which we take as evidence it has teeth.

**Assumptions we'd like challenged:**
- Whole-screen average luminance is our metric; we don't model localized retinal area
  beyond target size. Is that adequate at tablet viewing distances of 30–50 cm?
- Glow halos are counted at their gradient-weighted alpha (~0.18 of the halo disc).
- User photos: we measure each photo's actual luminance at import and bound fades accordingly.
- We treat ≤ 0.5 Hz periodic modulation as categorically safe. Any reason to go lower?

## 4. Current lesson inventory (infant band)

| Lesson | Level | Practises | Interactive |
|---|---|---|---|
| Gentle Glow | 1 | first visual attention | – |
| Little Star | 1 | sustained attention | – |
| Drifting Light | 1 | horizontal tracking | – |
| Magic Touch | 1 | cause & effect, visually guided reach | tap/switch |
| Firefly | 1 | noticing & re-finding (field-aware) | – |
| Raindrop | 1 | vertical tracking | – |
| Star Path | 2 | curved tracking + audio-visual binding | – |
| Two Fireflies | 2 | shifting gaze between two, invited looks | tap/switch |
| Rolling Ball | 2 | familiar object, anticipation | tap/switch |
| Little Duck | 2 | familiar object, tracking with pause | – |
| Balloon | 2 | upward tracking from lower field | tap/switch |
| A Familiar Face or Toy | 2 | familiarity/motivation (family's own photo) | – |
| Traveling Song | 1 (hearing) | auditory localization | – |
| Bell and Drum | 1 (hearing) | sound discrimination | – |

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

## 6. What this app never does

No diagnosis, scoring, grading, or normative comparison; no clinical terminology aimed at
families; no data collection (everything stays in the device's browser); no claims of
treatment effect. If any part of the experience feels like it breaks this, that's a
priority-one finding.
