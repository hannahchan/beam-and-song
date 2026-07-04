# Beam and Song

Gentle, tunable light-and-song lessons for **children with CVI** (cortical/cerebral visual impairment),
from babies to teens — a companion tool for families and vision professionals. Static site, no accounts,
no servers, no data leaving the device.

> **Status: feature-complete against the brief's build-side requirements — built for expert review, not
> yet clinically reviewed.** Per the brief (§11), vision-professional/clinical review of content and safety
> — and usability testing with actual CVI children across the age range — is expected **before** real-world use.
> The review packet is ready in `docs/clinical-review-packet.md`.

## What's inside

- **29 lessons across Levels 1–4** plus listening lessons, all rendered procedurally on canvas and scored
  by a Web Audio synthesizer (note data only — zero binary assets, ~61 KB gzipped total):
  - **Level 1 · Noticing** — one target on black: glow, star, drifting light, tap-anywhere
    cause-and-effect, firefly, raindrop.
  - **Level 2 · Following & finding** — curved paths with travelling sound, peekaboo anticipation
    behind a dark hill, a first look-then-touch reach, two fireflies inviting a look, ball, duck/boat,
    balloon, the child's own photo.
  - **Level 3 · Toward the world** — find-the-target among dim company (by brightness, by the child's
    own colour, or the family's own photo), a small restful scene, near/far distance drills.
  - **Level 4 · Higher-order looking** — visual search among drifting distractors, following through
    distraction, an ordered left-to-right sweep, familiar faces (family photos only — never stock imagery).
  - **Listening lessons** — hearing as a goal in its own right (CR-5), with its own second rung:
    sound announces, then light arrives, never both at once.
  - **Per-lesson guidance** (PT-10/CR-4): every card names the one thing it practises, points at a
    gentler and a bolder neighbour, carries a real-object bridge, and — on find/search lessons —
    suggests the quiet sound modes, since searching competes with listening for many children.
- **Three age bands** (CR-9/CR-10): the same practice re-presents itself per band — a teen at Level 1
  gets "Ember" with ambient music, never a duck with a nursery rhyme. A build-breaking test bans babyish
  language, imagery, and nursery tunes from teen output.
- **Personalization on every axis the brief names** (§5), presets + a guided setup, and **custom
  programs** (PT-9): named lesson sequences that play as queued sessions with slow crossfades.
- **The family's own media** (CR-3): photos (downscaled + luminance-measured client-side) and songs or
  voice recordings (IndexedDB, normalized client-side) as targets and music — on-device only, always.
  Each photo can carry a **recorded caregiver voice label** ("the red ball!") that plays as the answer in
  photo lessons — after a find, or when a look is marked in after-a-look mode.
- **Caregiver tooling**: profiles, instant persistence, export/import + whole-device backup, ten-second
  observations with day-context tags, trends, a summary formatted for your child's vision professional, a
  settings-review nudge, an optional PIN — and **opt-in field-pattern observation** (PT-13) that only ever
  speaks descriptively, after weeks
  of data, under a tested non-diagnostic language guard (SR-7).
- **Switch access built in** (AR-2/AR-8): one-switch auto-scanning and two-switch step-scanning with
  pace-derived dwell and a glide-only highlight; during lessons the switch belongs to the child, and in
  find/search lessons a switch press always counts as a hit.
- **Safety engine, verified not vowed** (§8): every animation flows through a kernel that clamps modulation
  to ≤ 0.5 Hz (the hazard band starts ~3 Hz), forbids fades under 500 ms, caps luminance swing, and
  cooldown-limits rewards. The test suite **simulates every lesson at 60 fps** — at default and extreme
  settings, under input mashing, across age bands — and measures the luminance timeline against
  flash-safety thresholds. It caught six real hazards during development; that is the point of it.
- **274 unit/safety/a11y tests + 6 Playwright E2E tests**, all gating deploy in CI along with enforced
  payload budgets (TR-9).

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # 274 tests incl. the safety simulation suite
npm run build      # type-check + production build to dist/
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (default branch `main`).
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Push to `main` — `.github/workflows/deploy.yml` tests, builds, and deploys.
   The site uses relative paths + hash routing, so it works at any base path with no extra config.

## Architecture (for the next person)

```
src/
  safety/     constants (the non-negotiable limits), luminance model,
              flash analyzer, spec validation
  engine/     kernel (safety-clamped animation primitives), params
              (settings → engine values, the single clamping funnel),
              scenes (pure, deterministic behaviors), render (thin canvas
              pass), audio (Web Audio synth + scheduler), melodies, haptics
  lessons/    lesson specs: behavior + copy for grown-ups
  lib/        types, store (localStorage, export/import), presets +
              guided-setup logic, summaries, router, photo processing
  ui/         Landing, Chooser (child tiles), Player (full-screen lesson),
              grownups/ (gate, dashboard, library, settings, notes,
              children, guide, guided setup)
tests/        safety simulation, validation, scenes, store, tokens/contrast,
              axe accessibility
```

Key invariant: **scenes are pure functions** of (lesson, params, time, seeded inputs) → display list. The
canvas layer only draws; the safety suite replays the same functions headlessly and measures the result.
Raise nothing in `src/safety/constants.ts` — lower is always acceptable.

## Privacy stance

Everything (profiles, settings, notes, photos) lives in `localStorage` in this browser. Nothing is uploaded;
there are no analytics, no accounts, no network calls after load (a service worker keeps it working offline).
Exports are explicit local file downloads, flagged as containing personal information about a child.

## Honest gaps / what only humans can finish

Tracked in [docs/requirements-coverage.md](docs/requirements-coverage.md) against every requirement ID,
with the forward plan in [docs/ROADMAP.md](docs/ROADMAP.md). The build-side phases are implemented; what
remains is human-dependent:

- **Clinical/vision-professional review and real-family usability testing** across the age range — the gate between
  "prototype" and "recommendable" (brief §11). Packet ready: `docs/clinical-review-packet.md`.
- **Assistive-tech hardware walkthrough** — scripts ready in `docs/at-walkthrough.md` (VoiceOver, NVDA,
  iOS Switch Control, Android), results tables waiting.
- **On-device performance soak** on an older iPad + budget Android tablet — protocol and in-player
  diagnostics (`?diag=1`) in `docs/perf-budgets.md`; CI already enforces the payload half.
- **Curated real-photo content** for L3/L4 beyond the family's own photos — sourcing/licensing/
  appropriateness are human judgments; the build deliberately ships without stock imagery.
- Smaller deferred threads: scannable slider/text values, per-lesson custom-audio mapping.

## A note on framing

Beam and Song is a **companion, not a curriculum**: it supports — and never replaces — a child's vision
professional or early-intervention team, and it deliberately contains no assessments, scores, or
diagnostic output of any kind.
