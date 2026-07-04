# Light & Sound

**Gentle light-and-song lessons for children with CVI** — a calm, tappable companion that helps babies
through teens practise *looking* and *listening*, at whatever pace and intensity suits them.

CVI (cortical/cerebral visual impairment) is the most common cause of childhood visual impairment in much
of the world. The eyes often work fine; it's the brain's visual processing that needs gentle, repeated,
low-clutter practice. Light & Sound gives a child one warm thing to notice on a black screen, lets them
make it respond, and slowly — only if it helps — adds a little more to look at.

It runs entirely in the browser. **No accounts, no servers, no data ever leaves the device.**

> **Where this stands:** the app is feature-complete and heavily tested, but it is a *prototype built for
> expert review, not yet clinically reviewed*. Vision-professional review of the content and safety, plus
> usability testing with real CVI children across the age range, is expected **before** real-world use. The
> review packet is ready in [`docs/clinical-review-packet.md`](docs/clinical-review-packet.md).

---

## Who this is for

- **Parents & caregivers** — a quiet activity you can tune to your child, in your child's own colours,
  with your own photos and your own voice. Nothing to sign up for; nothing to leak.
- **Vision therapists & early-intervention teams** — a companion between sessions, with a
  lesson-by-lesson walk-through and an exportable summary you can bring into your work. It's designed to
  support your program, never to assess or replace it.
- **Developers** — a small, dependency-light static site (Vite + Preact + TypeScript) with an unusually
  serious safety story and a test suite that simulates every lesson frame-by-frame. Jump to
  [Run it](#run-it) and [How it's built](#how-its-built).

---

## What it does

**A whole path, from first glance to real-world looking.** 30 lessons across four levels, plus
listening-only lessons — all drawn live on a canvas and scored by a Web Audio synthesizer (just note data,
**zero audio or image files**, about 62 KB gzipped for the whole app).

- **Level 1 · Noticing** — one warm target on black: a glow, a star, a drifting light, tap-anywhere
  cause-and-effect, and a *hold-to-keep-it-going* light that sings for exactly as long as the touch stays.
  Plus a firefly and a raindrop.
- **Level 2 · Following & finding** — a light that travels along a curve with its sound, peekaboo behind a
  dark hill, a first "look, then reach," two fireflies inviting a glance, a ball, a duck, a boat, a balloon —
  and your child's own photo.
- **Level 3 · Toward the world** — find the target among gentle company (by brightness, by your child's
  favourite colour, or from your family photos), a small restful scene, and near/far distance practice.
- **Level 4 · Higher-order looking** — visual search among drifting distractions, following through
  clutter, an ordered left-to-right sweep, and familiar faces (your family's photos only — never stock
  imagery).
- **Listening lessons** — hearing as a goal in its own right, with its own gentle progression: sound
  arrives first, *then* light — never both at once.

**Made for one child at a time.** Personalize colour, size, speed, brightness, sound, and more — via simple
presets, a guided setup, or full control. Build **custom programs**: named lesson sequences that play as a
calm, crossfading session.

**Your family, your media.** Add your own photos (resized and measured on-device) and your own songs or
voice recordings as targets and music — stored only in this browser, always. Each photo can carry a
**recorded caregiver voice label** ("the red ball!") that plays as the reward when your child finds or
looks at it.

**Grows with the child.** Three age bands re-present the *same* practice appropriately: a teen at Level 1
gets "Ember" with ambient music, never a duckling and a nursery rhyme. (A build-breaking test enforces
that — no babyish language, imagery, or tunes ever reach teen output.)

**Switch-accessible.** One-switch auto-scanning and two-switch step-scanning are built in. During a lesson
the switch belongs to the child, and in find/search lessons a switch press always counts as a hit.

**Caregiver tools.** Child profiles, instant save, export/import and full-device backup, ten-second
observation notes, simple trends, a summary formatted for your child's vision professional, an optional
PIN, a one-screen **lesson walk-through**, and a **printable off-screen kit** (the lesson shapes in your
child's colour, for practice away from the screen).

---

## Safety is the whole point

Flashing light can trigger seizures, so safety here isn't a promise — it's **enforced by code and proven by
tests**. Every animation flows through one small kernel that:

- clamps modulation to **≤ 0.5 Hz** (the photosensitive hazard band starts around 3 Hz),
- forbids fades shorter than **500 ms**,
- caps how far brightness can swing, and
- rate-limits rewards so nothing can stutter or strobe.

Then the test suite **replays every lesson at 60 fps** — at default *and* extreme settings, under frantic
input, across every age band — and measures the brightness timeline against flash-safety thresholds. This
caught six real hazards during development. That's exactly why it exists.

The ceilings live in `src/safety/constants.ts` and are treated as non-negotiable: lower is always fine,
raising them is not.

---

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # 300 automated tests, incl. the safety simulation suite
npm run build      # type-check + production build to dist/
npm run test:e2e   # Playwright end-to-end tests
```

Requires Node. The only runtime dependency is Preact — everything else is a dev tool.

## Deploy to GitHub Pages

1. Push this repo to GitHub (default branch `main`).
2. In the repo: **Settings → Pages → Source: GitHub Actions**.
3. Push to `main` — [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) tests, builds, and
   deploys. The site uses relative paths and hash routing, so it works at any base path with no extra
   config.

---

## How it's built

A static Vite + Preact + TypeScript app with a deliberately clean split between *deciding what to show* and
*drawing it*.

```
src/
  safety/   the non-negotiable limits, luminance model, flash analyzer, spec validation
  engine/   kernel (safety-clamped animation primitives), params (the single settings→engine
            funnel), scenes (pure, deterministic behaviours), render (thin canvas pass),
            audio (Web Audio synth + scheduler), melodies, haptics
  lessons/  lesson specs: behaviour + copy for grown-ups
  lib/      types, store (localStorage, export/import), presets + guided-setup logic,
            summaries, router, photo processing
  ui/       Landing, Chooser, Player (full-screen lesson), and the grown-ups area
            (gate, dashboard, library, settings, notes, children, guide, guided setup)
tests/      safety simulation, validation, scenes, store, contrast, and axe accessibility
```

**The key idea:** scenes are **pure functions** of `(lesson, params, time, seeded inputs) → display list`.
The canvas layer only draws; the safety suite replays those same functions headlessly and measures the
result. That's what makes "every lesson is provably flash-safe" testable rather than aspirational.

The build stays a **zero-asset-fetch static bundle** — CI enforces payload budgets so it can't quietly
bloat. There's an opt-in [screenshot gallery](docs/gallery.md) that captures every lesson per age band for
human review.

---

## Privacy

Everything — profiles, settings, notes, photos, recordings — lives in `localStorage` and IndexedDB in this
one browser. Nothing is uploaded. There are no analytics, no accounts, and no network calls after load (a
service worker keeps it working offline). Exports are explicit local file downloads, clearly flagged as
containing personal information about a child.

---

## Honest gaps — what only people can finish

Everything is tracked against the source requirements in
[docs/requirements-coverage.md](docs/requirements-coverage.md), with the plan ahead in
[docs/ROADMAP.md](docs/ROADMAP.md). The build side is done; what remains is human work:

- **Clinical review and real-family usability testing** across the age range — the line between
  "prototype" and "recommendable." Packet ready: [`docs/clinical-review-packet.md`](docs/clinical-review-packet.md).
- **Assistive-tech hardware walkthrough** (VoiceOver, NVDA, iOS Switch Control, Android) — scripts ready in
  [`docs/at-walkthrough.md`](docs/at-walkthrough.md), results tables waiting.
- **On-device performance soak** on an older iPad and a budget Android tablet — protocol and in-player
  diagnostics (`?diag=1`) in [`docs/perf-budgets.md`](docs/perf-budgets.md).
- **Curated real-photo content** for Levels 3–4 beyond your own photos — sourcing and licensing are human
  judgments, so the build ships without stock imagery on purpose.

---

## A note on framing

Light & Sound is a **companion, not a curriculum**. It supports — and never replaces — a child's vision
professional or early-intervention team, and it deliberately contains no assessments, scores, or diagnostic
output of any kind.
