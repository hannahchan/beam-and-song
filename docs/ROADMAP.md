# Roadmap — from infant v1 to the full brief

What remains against the requirements, organized into phases that each end in something
shippable. Requirement IDs refer to `CVI-training-site-requirements-final.md`; current
status per ID is in `requirements-coverage.md`.

> **Status (July 2026): Phases 1–5 are implemented** (see git history: one commit per
> logical unit), **plus a structural content round** informed by a survey of other CVI
> apps and the intervention literature: six new lessons (anticipation/peekaboo, a first
> visually-guided reach, sound-then-light listening, colour-anchored finding, a resting
> scene, an ordered sweep), a bridge on every lesson, per-lesson skill chips and
> gentler/bolder step links, and a quiet-looking suggestion on the search lessons.
> What remains is exactly the human-dependent work:
> Phase 0's clinical review and family testing, the AT hardware walkthrough
> (`at-walkthrough.md`), and the on-device performance soak (`perf-budgets.md`).
> **The two headline borrowables have since shipped:** per-photo caregiver voice
> labels (the Perkins/My Talking Picture Board pattern — record "the red ball!" on a
> photo and that voice answers in the photo lessons), and hold-to-sustain contingency
> (Keep the Light Singing / Sustain — the Sensory Light Box model, on a slew-limited
> kernel envelope with hold-mash and resonant-cycling safety simulation).
> Open build-side threads, deliberately deferred: scannable slider/text-field values,
> per-lesson mapping of full songs, a curated stock-photo track for L3/L4 (human-gated
> on licensing/appropriateness), and whatever the clinical feedback surfaces.

---

## Phase 0 — Clinical review track (start now, runs in parallel)

The brief (§11) makes expert review a gate, and it has the longest lead time because it
depends on other people. Nothing here blocks coding.

- Assemble a review packet: one-page product description, the safety approach and its
  assumptions (luminance model, thresholds), all lesson copy, screenshots/screen
  recordings, and specific questions (are the readiness cues right? is the glow framing
  right? melody tempos?).
- Recruit 2–3 vision professionals / CVI specialists and a couple of families for structured feedback.
- Add a `docs/clinical-feedback.md` log; every finding becomes an issue.

**Exit:** at least one professional review completed and triaged.

---

## Phase 1 — Deepen the infant product (PT-9, CR-3 audio, photo polish)

Highest value-to-effort for the users the app already serves, and makes the clinical
review more meaningful.

1. **Custom programs (PT-9)** — named, ordered lesson sequences per child.
   - Data: `programs: {id, name, lessonIds[]}[]` on Profile; builder UI in the grown-up
     area (add/remove/reorder with buttons — keyboard/switch friendly, no drag-required).
   - Child flow: a program plays as a **session queue** — lessons chained with slow
     cross-fades and a silence gap (FR-7), still ending at the session timer / rest moon.
   - The chooser shows programs as tiles alongside starred lessons.
2. **Custom audio (CR-3 completion)** — a favourite song or a recorded voice as the
   melody/reward for any lesson.
   - **Storage must move to IndexedDB** for media blobs (localStorage's ~5 MB ceiling is
     too small; photos can migrate too). Keep profiles in localStorage; media referenced
     by id. Export embeds media as base64 with a size warning (PV-4), or optionally
     excludes it.
   - Client-side decode → trimmed/normalized AudioBuffer (TR-7); gentle gain envelope and
     the master compressor keep SR-2's audio analogue.
   - New audio path: buffer playback beside the synth; 'after-a-look' phrase mode plays
     ~8s snippets.
3. **Photo target polish** — choose which photo a lesson uses; cycle through photos
   across cycles (PR-9 novelty control decides); **measure each photo's real luminance
   client-side at import** and feed it to the safety model (replaces the white worst-case
   assumption, which will otherwise over-constrain busier future scenes).
4. Small items: bulk export of all profiles (therapist devices), import offering
   update-vs-copy for an existing profile id, service-worker update notice, an
   add-to-home-screen tip in the Guide.

**Exit:** a vision professional can compose and export a per-child program with the family's own audio
and photos; safety suite green including a worst-case (all-white) measured photo.

---

## Phase 2 — Access for every body (AR-2/AR-8 scanning, TR-10 manual pass)

Motor impairment is a core comorbidity; this phase makes the product genuinely usable
with one switch, without relying on OS-level scanning.

1. **Built-in switch scanning** — an opt-in scanning mode in settings:
   - Auto-scan (single switch) and step-scan (two switch) over all interactive elements.
   - Scan dwell time driven by the **pace/latency setting (PR-5)**, floor ≥ 1.5 s.
   - The scan highlight is itself a stimulus: high-contrast steady outline, fades between
     items (≥ 500 ms, kernel-timed), never blinks — add it to the safety suite by
     rendering the highlight state machine through the same analyzer.
   - Child-side: scanning reduces to a single "activate" — already tap-anywhere, so the
     switch simply triggers it (works today; document it).
2. **Manual AT walkthrough (TR-10)** — scripted passes with VoiceOver (iPad + macOS),
   NVDA, keyboard-only, and iOS Switch Control; record results in
   `docs/at-walkthrough.md`; fix findings.
3. **Playwright smoke suite** — the pieces jsdom can't touch: landing → chooser → player
   canvas actually animating, gate hold vs word path, Escape overlay, session save,
   export download. Runs headless in CI after unit tests.

**Exit:** app fully operable with one switch end-to-end; AT walkthrough documented; E2E
suite in CI.

---

## Phase 3 — Age bands (CR-6, CR-9, CR-10, CR-11, PR-14) — the headline gap

The architecture already treats lessons as specs with parameterized rendering; this
phase makes age a real axis.

1. **Profile age band (PR-14)** — `ageBand: 'infant' | 'child' | 'teen'` set in guided
   setup / settings, changeable anytime, independent of levels (CR-9).
2. **Band-aware rendering (CR-10)** — specs gain per-band variants for theme, shape,
   melody, and copy tone; the engine picks by band at play time:
   - *child* (~2–9): current warmth, slightly less nursery — e.g. Boat on water, Lantern,
     Kite; brighter folk melodies.
   - *teen/older*: dignified themes — Aurora, Ember, Orbit, Rain-on-glass, City lights at
     night; slow ambient/synth progressions (composed as note data — no licensing risk);
     copy addressed to "they/them", never "your baby".
   - Same behaviors, same safety kernel — a teen at Level 1 gets a single high-salience
     ember on black (CR-9's test case), not a duck.
3. **Grown-up copy audit** — everything currently says "baby"; parameterize by band.
4. **Prioritize the underserved cells (CR-11):** ship the teen row for Levels 1–2 first.
5. Guided setup asks the band question first and adjusts its own wording.

**Exit:** switching a profile between bands re-skins every existing lesson appropriately;
teen-at-Level-1 demo passes a "would a 14-year-old feel respected?" copy/content review.

---

## Phase 4 — Levels 3–4 (CR-8, phase expansion; builds on Phase 3)

Challenge from visual demand, never from speed/flash — safety constants unchanged.

1. **Asset pipeline (CR-2/TR-3 for real photos):** curated CC0 photo targets, build-time
   script resizes/compresses (AVIF/WebP + fallback), **measures each asset's real
   luminance into a manifest** for the safety model, and adds per-lesson preload +
   service-worker precache. Performance budgets enforced in CI (image ≤ 60 KB each,
   lesson payload ≤ 400 KB).
2. **Level 3:** familiar-object photos on gently textured (never patterned, SR-5)
   backgrounds; "find the item" (target among 2–4 distractors, tap/scan to choose —
   forgiving, latency-aware); fuller layered arrangements of existing melodies;
   readiness cues for L2→L3 (CR-7).
3. **Level 4:** visual search under real clutter (photo scenes with measured luminance),
   moving target among slow distractors, near/far size drills, and **face familiarity
   using the family's own photos** (CR-3 synergy — no stock faces, no privacy exposure).
   Distractor counts/clutter scale with complexity (PR-3) up to the CR-8 ceiling.
4. **Safety-model extension:** multi-element scenes and textured grounds need the
   analyzer to handle regional luminance (a busy-but-static scene is fine; the *rate of
   change* stays capped). Extend tests to the busiest L4 scene at max settings (SR-8's
   explicit requirement).

**Exit:** the full Level 1–4 × age-band grid has content; safety suite covers the
busiest scenes; budgets measured in CI.

---

## Phase 5 — Observation depth (PT-13) and performance proof (TR-9)

1. **Field-pattern observation (PT-13)** — opt-in, off by default:
   - During suitable lessons, log target region + whether a response was marked (parent
     tap in after-a-look mode, or interaction in cause-effect lessons).
   - Surface **only after ≥ 8 sessions across ≥ 2 weeks**, only in the grown-up area, as
     descriptive sentences ("targets low on the screen were noticed more often these
     weeks"), always with the fatigue/mood caveat, always routing interpretation to the
     professional; wording passes the SR-7 banned-language validator (extend it).
   - Feeds a one-tap "try favouring lower field?" suggestion (PR-4 tuning), phrased as an
     experiment, never a finding. Exportable in the vision-professional summary.
2. **Perf harness (TR-9):** in-app frame-drop and audio-underrun counters (dev flag),
   a scripted 3-minute soak per lesson on target hardware (an older iPad + a budget
   Android tablet), results in `docs/perf-budgets.md`; regressions gate on the CI numbers
   we *can* measure (bundle size, per-lesson payload).
3. Cross-device matrix pass (TR-5) folded into the same hardware session.

**Exit:** PT-13 shippable behind its guardrails; measured (not assumed) performance on
low-end tablets.

---

## Sequencing logic & standing rules

- Phases 1–2 first: they serve today's real users and make the Phase-0 review credible.
  Phase 3 before 4 because upper-level content must be born age-aware. Phase 5 last:
  it's optional-by-design and benefits from the accumulated data and review feedback.
- Every phase: new behaviors go through the kernel, get simulated by the safety suite
  automatically, and never touch `src/safety/constants.ts` upward.
- Copy rule stands everywhere: companion, not curriculum; descriptive, never diagnostic.
