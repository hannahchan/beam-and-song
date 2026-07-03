# Performance budgets (TR-9)

"No stutter or jank" is measured, not assumed. Two halves:

## 1. CI-enforced payload budgets (`scripts/check-budgets.mjs`)

Runs on every build in CI; the deploy fails if exceeded.

| Budget | Limit | Rationale |
|---|---|---|
| JS, gzipped | 70 KB | Whole app incl. all lessons and synthesized music — parses fast on old tablets. |
| CSS, gzipped | 10 KB | |
| HTML, gzipped | 3 KB | |
| Total payload, raw | 400 KB | Everything a device ever downloads (incl. icons). No per-lesson fetches exist at all. |

The app renders visuals procedurally and synthesizes audio from note data, so lessons
perform **zero asset fetches** — the classic stutter sources (image decode, audio
buffering) are designed out rather than optimized.

## 2. On-device soak (human, with real hardware)

Suggested devices: the oldest iPad in the house/clinic, plus a budget Android tablet.

1. Open the deployed site, add `?diag=1` style flag by opening any lesson URL as
   `…/#/play?lesson=<id>&diag=1`. A dim stat line appears at the top:
   `frames · dropped (%) · worst frame`.
2. For each lesson (or at least: gentle-glow, star-path, hidden-among-many at
   complexity 3, familiar-faces with 3 photos), let it run a full session at
   **maximum settings** (size 5, glow 3, brightness 3, speed 5).
3. Record the dropped-frame percentage and worst frame time after ~3 minutes.

**Pass criteria:** dropped < 1% sustained, worst frame < 100 ms (a single GC hiccup is
tolerated), no audible audio gap, no visible hitch during lesson handovers in a program.

| Device | Browser | Lesson | Dropped % | Worst ms | Audio gaps? | Pass |
|---|---|---|---|---|---|---|
| | | | | | | ☐ |

Findings go to issues; regressions on the CI-measurable side are already blocked.
