# Lesson gallery (screenshot flip-book)

`tests/e2e/gallery.spec.ts` captures every lesson in `src/lessons/specs.ts` as a
full-viewport PNG — a flip-book of the whole library for a human eye to review.
It is opt-in: the default `npx playwright test` run (the CI deploy gate) skips it.

- **Run:** `GALLERY=1 npx playwright test tests/e2e/gallery.spec.ts`
- **Output:** `test-results/gallery/<band>/<NN>-<lesson-id>.png`, numbered in library order.
- **Age band:** add `BAND=child` or `BAND=teen` to capture the re-skinned library
  (default `infant`).

Each shot waits ~4.5 s so the scene develops past its entry fade. A seeded throwaway
profile with one tiny generated photo lets the photo-gated lessons play their real
scene. Playwright clears `test-results/` at the start of every run, so copy the
folder elsewhere before the next run if you want to compare bands side by side.
