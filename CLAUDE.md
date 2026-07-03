# Beam and Song — agent notes

Static Vite + Preact + TS app: gentle lesson player for babies with CVI. See README.md and
docs/requirements-coverage.md; the source requirements live in CVI-training-site-requirements-final.md.

## Commands
- `npm run dev` / `npm run build` (tsc + vite) / `npm test` (vitest) / `npm run icons`

## Non-negotiables
- **Never raise anything in `src/safety/constants.ts`.** Those are seizure-safety ceilings (SR-1..SR-8).
  Lower is always fine. Any new animation must go through `engine/kernel.ts` primitives
  (`safeMod`, `fadeEnvelope`, `effectiveTaps`) — never hand-rolled sin/step changes.
- Every new lesson/behavior MUST be pure & deterministic (seeded rng only) so `tests/safety.test.ts`
  can simulate it; add it to LESSONS and the suite covers it automatically.
- Ramps must not stack: gate interaction responses by the entry envelope (see causeEffect/inviteTwo
  for the pattern) or the safety suite will fail you — that's it working.
- No patterned backgrounds (stripes/checks), no saturated-red flashing, no text on the child screen
  beyond dim transient hints.
- Copy rules: companion-not-curriculum framing (SR-4); never diagnostic/clinical language
  (validate.ts has a banned-words guard); child data is nickname-only, local-only.

## Architecture in one breath
Scenes (`engine/scenes.ts`) are pure: (spec, params, t, sim) → display list + cues. `render.ts` only
draws; `audio.ts` synthesizes (no audio files); `params.ts` is the single settings→engine clamping
funnel. Store is localStorage v1 with export/import. Hash routing; GitHub Pages via
.github/workflows/deploy.yml (Pages source must be "GitHub Actions").
