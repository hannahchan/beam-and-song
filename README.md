# Beam and Song

Gentle, tunable light-and-song lessons for **babies with CVI** (cortical/cerebral visual impairment) — a
companion tool for families and vision professionals. Static site, no accounts, no servers, no data leaving
the device.

> **Status: v1, infant scope — built for expert review, not yet clinically reviewed.**
> The full requirements brief spans birth to teens; this first build deliberately serves **infants**
> (roughly birth–18 months) so there is something real to iterate on. Per the brief (§11), TVI/clinical
> review of content and safety — and usability testing with actual CVI children — is expected **before**
> real-world use.

## What's inside

- **14 lessons** across three groups, all rendered procedurally on canvas and scored by a Web Audio
  synthesizer (public-domain lullabies as note data — zero binary assets, ~35 KB gzipped total):
  - **Level 1 · Noticing** — one target on black: pulsing glow, twinkling star, drifting light for
    tracking, tap-anywhere cause-and-effect, appearing/vanishing firefly, falling raindrop.
  - **Level 2 · Following & finding** — star on a curved path with sound that travels with it, two
    fireflies inviting a look, rolling ball, gliding duck, rising balloon, and the child's **own photo**
    (processed and stored on-device only).
  - **Listening lessons** — hearing as a goal in its own right: a song that travels ear-to-ear, and
    bell/drum discrimination.
- **Personalization on every axis the brief names** (§5): target colour, background, movement + speed,
  complexity, visual-field bias, pace/latency, size, glow (down to none), brightness, three sound modes
  (with / after-a-look / off), volume, single vs layered voices, sound-follows-target, haptics, session length.
- **Presets + a 5-question guided setup** so no one meets a wall of sliders on day one.
- **Caregiver tooling**: multiple child profiles, instant persistence, export/import (JSON), ten-second
  session observations with day-context tags, a 4-week trend view, a plain-text summary to hand a TVI,
  a settings-review nudge, and an optional PIN for shared devices.
- **Safety engine, verified not vowed** (§8): every animation flows through a kernel that clamps modulation
  to ≤ 0.5 Hz (the hazard band starts ~3 Hz), forbids fades under 500 ms, caps luminance swing, and
  cooldown-limits rewards. The test suite **simulates every lesson at 60 fps** — at default and at the most
  extreme reachable settings, under input mashing — and measures the luminance timeline against flash-safety
  thresholds. The suite caught four real hazards during development; that is the point of it.

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # 124 tests incl. the safety simulation suite
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

## Honest gaps / next iterations

Tracked in [docs/requirements-coverage.md](docs/requirements-coverage.md) against every requirement ID. Highlights:

- **Older age bands** (CR-6/CR-9/CR-10/CR-11): the age×phase grid, age-respecting themes for
  children/teens — the largest deliberate scope cut for v1.
- **Levels 3–4** content (real photos on busier grounds, visual search, crowding).
- **PT-13 field-pattern observation**: deferred; needs careful SR-7 non-diagnostic design.
- **PT-9 custom programs** (ordered sequences beyond favorites).
- **Built-in switch auto-scanning**: v1 relies on OS-level switch access (iOS Switch Control /
  Android Switch Access) over fully semantic controls; a native scanner with latency-aware timing (AR-8)
  is a natural next step.
- **Custom audio** (a favourite song as reward) — photos shipped first.
- **Measured device performance budgets** (TR-9): the asset side is trivially met (no assets); frame-time
  measurement on low-end tablets still needs a hardware pass.
- **Clinical/TVI review and real-family usability testing** — required before promoting this beyond a
  prototype (brief §11).

## A note on framing

Beam and Song is a **companion, not a curriculum**: it supports — and never replaces — a child's TVI,
vision professional, or early-intervention team, and it deliberately contains no assessments, scores,
or diagnostic output of any kind.
