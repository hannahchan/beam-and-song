# Light & Sound: agent notes

Static Vite + Preact + TS app: gentle lesson player for children with CVI. See README.md and
docs/requirements-coverage.md; the source requirements live in CVI-training-site-requirements-final.md.

Origin and stance: built by Claude Fable 5 as a demonstration of the model. It is an
intermittently-developed side project, not clinically reviewed, and framed as-is. Keep prose in the
docs and UI friendly and free of em dashes (they read as an AI tell); use commas, periods, or
parentheses instead.

## Commands
- `npm run dev` / `npm run build` (tsc + vite) / `npm test` (vitest) / `npm run test:e2e` (playwright) / `npm run icons`

## Non-negotiables
- **Never raise anything in `src/safety/constants.ts`.** Those are seizure-safety ceilings (SR-1..SR-8).
  Lower is always fine. Any new animation must go through `engine/kernel.ts` primitives
  (`safeMod`, `fadeEnvelope`, `effectiveTaps`/`effectiveTapEvents`), never hand-rolled sin/step changes.
- Every new lesson/behavior MUST be pure & deterministic (seeded rng only) so `tests/safety.test.ts`
  can simulate it; add it to LESSONS and the suite covers it automatically.
- Ramps must not stack: gate interaction responses by the entry envelope (see causeEffect/inviteTwo
  for the pattern) or the safety suite will fail you: that's it working.
- No patterned backgrounds (stripes/checks), no saturated-red flashing, no text on the child screen
  beyond dim transient hints.
- Copy rules: companion-not-curriculum framing (SR-4); never diagnostic/clinical language,
  `NON_DIAGNOSTIC_BANNED` in `src/safety/validate.ts` gates lesson copy AND all PT-13 output templates;
  child data is nickname-only, local-only.
- Age bands (lessons/bands.ts): teen output must contain no babyish language/imagery/nursery
  tunes; tests/bands.test.ts breaks the build otherwise. Band resolution may change skin only,
  never behavior/level/interactivity.
- Switch access: a TapEvent with x < 0 is a switch press and ALWAYS counts as a hit in
  find/search lessons. Scanning (ui/scan.ts) suspends while `.bs-lesson-live` is on body.
- Payload budgets (scripts/check-budgets.mjs) run in CI: the app stays a zero-asset-fetch
  static bundle; don't add binary lesson assets without extending the budget doc first.

## Internationalisation-readiness (English-only today; keep the seams clean)
The app ships English only, but new code must not add debt that a future translation has to unpick:
- **Never persist a display string.** Persist a stable key and render its label from `lib/labels.ts`.
  Stored enums (session tags, colours, settings) already do this; a new one rendered raw becomes a
  store migration later. `lib/locale.ts` holds the single active locale (`LOCALE`).
- **Route dates, durations, and plurals through `lib/fmt.ts`** (`formatDate`/`formatDuration`/
  `formatMinutes`/`plural`), no inline `toLocaleDateString()`, `${n} min`, or `${n === 1 ? '' : 's'}`.
- **Don't bake grammar into logic:** no sentence assembly from fragments, no pronoun-conditioned verb
  endings, no morphological find-replace. Interpolate whole values; for age bands prefer explicit
  per-band copy in `lessons/bands.ts` over `adaptCopy`'s English-only regex (locale-gated, `en` only).
- **CSS uses logical properties** (`margin-inline-start`, `inset-inline-start`, `text-align: start`),
  not physical `left`/`right`, so RTL stays ~free.
- The SR-7 guards (`NON_DIAGNOSTIC_BANNED`, the teen banned-word list in `tests/bands.test.ts`) are
  English word-lists. Any new language needs its own clinically-reviewed list; they don't translate.

## Architecture in one breath
Scenes (`engine/scenes.ts`) are pure: (spec, params, t, sim) → display list + cues. `render.ts` only
draws; `audio.ts` synthesizes (no audio files); `params.ts` is the single settings→engine clamping
funnel. Store is localStorage v1 with export/import. Hash routing; GitHub Pages via
.github/workflows/deploy.yml (Pages source must be "GitHub Actions").
