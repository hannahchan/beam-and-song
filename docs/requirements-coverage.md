# Requirements coverage

Status of every requirement ID from `CVI-training-site-requirements-final.md` in this build.
**Scope:** the full brief, Levels 1–4 across all three age bands (infant, child, teen), plus the
listening lessons. The build grew from an infant-first v1, and the architecture made that expansion
clean: themes are reusable, phase and rendering are decoupled in lesson specs, and levels are data,
not code. Everything below is implemented; the only 🟡 items are gated on a human or hardware review
step, not on further coding.

Legend: ✅ done · 🟡 partial (human/hardware step remaining)

## §2 Site structure & navigation

| ID | Status | Notes |
|---|---|---|
| FR-1 | ✅ | Calm black landing; one big Start orb; small "For grown-ups" door. |
| FR-2 | ✅ | Full-screen canvas player, no chrome except one dim corner pause button; fullscreen API + wake lock. |
| FR-3 | ✅ | Child tiles are huge (≈40 vmin), high-contrast, generously spaced. |
| FR-4 | ✅ | Library grouped by level + listening; starring puts lessons on the child screen. |
| FR-5 | ✅ | Child can never dead-end; grown-up gate = press-and-hold **or** tap-the-word; corner pause opens a two-step overlay an infant can't complete. |
| FR-11 | ✅ | Every gate/exit path is single-tap-or-keyboard operable (hold has a no-hold alternative); overlay buttons are ordinary large buttons. |

## §3 Lesson experience

| ID | Status | Notes |
|---|---|---|
| FR-6 | ✅ | Three sound modes: with / **after a look** (tap-to-answer) / off. On the find/search lessons "with" binds to the after-a-look way (quiet search, sound as the answer; PR-11, see `sound-design.md`). |
| FR-7 | ✅ | Pace axis multiplies all durations; nothing ever auto-advances faster than configured; session ends in a rest screen, not more content. |
| FR-8 | ✅ | Kernel enforces ≥500 ms eased fades; verified by simulation (a hard cut was caught and fixed in development). |
| FR-9 | ✅ | Magic Touch + interactive responses across the cause-and-effect lessons; tap-anywhere; Space/Enter = switch input; rewards obey all safety caps under input mashing (tested). |
| FR-10 | ✅ | StereoPanner follows target x; per-profile toggle; hearing lessons pan by design. |
| FR-12 | ✅ | Pause overlay dims + hushes instantly; "Softer" mode halves light/sound; End is always two taps away; auto-pause when the tab hides. |

## §4 Content & progression

| ID | Status | Notes |
|---|---|---|
| L1/L2 content | ✅ | Both levels fully built, L1 includes sustained contingency (Keep the Light Singing: the light answers exactly as long as a touch or held switch stays, on a slew-limited kernel envelope no press pattern can flicker); L2 includes anticipation (Peekaboo Light) and a first visually-guided reach (Reach for the Light). |
| L3/L4 content | ✅ | L3: find-among by brightness, by the child's own colour (Find Your Colour), or by own-photo familiarity; a small resting scene; near/far distance drills. L4: visual search among drifting company, follow-among-movers, an ordered left-to-right sweep (Star by Star), familiar faces (family photos only, no stock imagery; a curated-photo track remains open, human-gated for licensing/appropriateness). |
| CR-1 | ✅ | Stars/Fireflies/Light/Rain/Colour/Familiar-things themes recur across levels. |
| CR-2 | ✅ | No binary assets at all, visuals procedural, audio synthesized; the whole app gzips to a tiny bundle. |
| CR-3 | ✅ | Photos: client-side downscale + luminance measurement, on-device, drive four lessons. Audio: the family's own songs/recordings (IndexedDB blobs, client-side normalization, duration caps) can replace the built-in melodies, including after-a-look snippets. Each photo can also carry a short **recorded caregiver voice label** (mic capture with file fallback, ≤10 s, normalized) that plays as the answer in photo lessons, the Perkins "meaningful pictures and sounds" pattern. Nothing ever leaves the device. |
| CR-4 | ✅ | A real-object bridge on **every** lesson (validator-enforced), surfaced in the library cards, screens are the doorway, not the destination. |
| CR-5 | ✅ | Six listening-first lessons with their own ladder: noticing (traveling song), turning toward sound (localization game with parent-marked turns), discrimination (bell/drum, drum/tune, loud/soft), then sound-announces-light (Song, Then Star, sequential, never simultaneous) + "Listening first" preset. |
| CR-6 | ✅ | Three bands (infant / child / teen) selectable per profile and in guided setup. |
| CR-7 | ✅ | Readiness cues per lesson ("watch for") + a skill chip naming what each lesson practises + gentler/bolder step links on every card + move-up/step-back guidance in the Guide. |
| CR-8 | ✅ | Challenge scales through clutter count (complexity setting), drifting distractors, colour-anchored search, ordered sweeping, target size (near/far), movement-among-movers, and faces, all inside unchanged Section 8 limits; find/search rewards are cooldown-bound and switch-operable (a switch press always counts as a hit). |
| CR-9 | ✅ | Band re-skins theme/music/copy only, behavior, level, interactivity provably unchanged (tested). A teen at Level 1 gets "Ember", not a duck, verified down to the drawn scene items, not just the spec. |
| CR-10 | ✅ | Full teen re-skin (ambient melodies composed as note data; boat/ember/orbit/lighthouse/skyline themes); child band = warm content with adjusted wording; a build-breaking test bans babyish language/imagery/nursery tunes from teen output. |
| CR-11 | ✅ | The full lesson set spans all three bands across Levels 1–4 + listening; the historically underserved cells (older children/teens at early phases) get the full re-skinned rows, and Levels 3–4 no longer depend on photos for most of their content. Ongoing content growth stays welcome, gated on clinical feedback. |

## §5 Personalization

PR-1…PR-14: **all implemented**: colour+background (PR-1), movement/speed (PR-2), complexity (PR-3),
field bias incl. strength (PR-4), pace (PR-5), size (PR-6), brightness (PR-7), audio volume/texture/binding
(PR-8), favourites-first novelty control (PR-9), presets (PR-10), audio-competition modes (PR-11,
binding on the find/search lessons: searching competes with listening, so "with" plays them the
after-a-look way, quiet search and sound as the answer; the app-wide default stays "with" pending
clinical review, see `sound-design.md`), guided setup (PR-12), glow-to-zero with anti-light-gazing
copy (PR-13), and age band per profile (PR-14).

## §6 Parent/caregiver tooling

| ID | Status | Notes |
|---|---|---|
| PT-1/PT-2 | ✅ | Multiple profiles; instant persistence. |
| PT-3 | ✅ | Export/import JSON incl. photos & notes; collision-safe import. |
| PT-4 | ✅ | Ten-second observation card at session end (response + tags + note), fully skippable. |
| PT-5 | ✅ | Review nudge after >35 days & ≥8 sessions; "mark reviewed" button. |
| PT-6 | ✅ | Session timer (2–8 min) → gentle wind-down to a rest screen; "short and sweet" nudge on repeats. |
| PT-7 | ✅ | 4-week trend, response mix, top lesson, weekly bars (with text alternative), plain-text vision-professional summary export. |
| PT-8 | ✅ | Day-context tags; summaries call out that quiet hard-days are expected, not decline. |
| PT-9 | ✅ | Named ordered programs with a button-based (switch-friendly) builder; programs play as queued sessions with slow crossfades; program tiles on the child screen. |
| PT-10 | ✅ | Guide section + per-lesson cues, now including L2→L3 and L3→L4. |
| PT-11 | ✅ | Room/lighting/distance/positioning guidance in Guide + dashboard reminder. |
| PT-12 | ✅ | "What CVI is / what a response looks like / when to stop / find a professional", orientation framing only. |
| PT-13 | ✅ | Opt-in, off by default. Quadrant exposure/response tallies per session; surfaces only after ≥8 qualifying sessions across ≥14 days with per-quadrant exposure floors; stale data ignored. Output descriptive + hedged + routed to the professional; every producible sentence is tested against the SR-7 language guard; at most a field-bias *experiment* is suggested. |

## §7 Accessibility

| ID | Status | Notes |
|---|---|---|
| AR-1 | ✅ | ≥44–56 px targets everywhere; child side is tap-anywhere. |
| AR-2/AR-8 | ✅ | Built-in auto (one-switch) and step (two-switch) scanning: dwell derives from the pace/latency setting (≥1.5 s floor), the highlight is one steady gliding ring (≥500 ms ease, never blinks, unit-tested against the fade floor), and scanning suspends during live lessons so the switch stays the child's input. Find/search lessons treat a switch press as a hit; the hold lesson treats a held switch as a hold. Every slider has −/+ stepper buttons, so scanning operates them like any button. OS-level scanning also works throughout. Remaining niche: free-text fields (names, notes, PIN) defer to platform tools (documented). |
| AR-3 | ✅ | Touch-first layout, `touch-action: manipulation`, safe-area insets. |
| AR-4 | ✅ | Token palette verified ≥4.5:1 by test. |
| AR-5 | ✅ | Plain-language grown-up UI; complexity behind presets. |
| AR-6 | 🟡 | Semantic HTML, labels, focus management, skip link, axe suite green on every page; **manual** screen-reader + keyboard walkthrough still to do (TR-10). |
| AR-7 | ✅ | Visual-only mode; nothing depends on hearing; haptic reward channel where supported (noted iPad limitation). |

## §8 Safety (hard constraints)

| ID | Status | Notes |
|---|---|---|
| SR-1 | ✅ | Kernel clamps all periodic modulation ≤0.5 Hz (risk band ≈3 Hz+); analyzer counts flash pairs, allows ≤1/s (WCAG allows 3). |
| SR-2 | ✅ | ≥500 ms eased fades enforced at the kernel; verified. |
| SR-3 | ✅ | Screen-luminance cap 0.8; ≤0.18 swing per 500 ms; brightness setting maps under the caps. |
| SR-4 | ✅ | Companion framing on landing, footer of every grown-up page, Guide, exports. |
| SR-5 | ✅ | No patterned backgrounds exist; saturated-red area transitions must be zero (tested); luminance model counts glow halos. |
| SR-6 | ✅ | Rewards ride the same kernel; input-mashing simulated in tests; cooldown 1.5 s enforced in engine *and* scene. |
| SR-7 | ✅ | A shared banned-language regex (clinical/deficit/scoring vocabulary) gates lesson copy at validation time and is asserted over every sentence the PT-13 feature can produce. Output is session-bound, hedged, and always routes to the professional; the guard rejected authored copy twice during development. |
| SR-8 | ✅ | The centerpiece: headless 60 fps simulation of every lesson × extreme settings × input spam, measured against the limits; the analyzer itself is negative-tested against synthetic strobes/cuts. |

## §9 Technical

| ID | Status | Notes |
|---|---|---|
| TR-1 | ✅ | Pure static; relative base + hash routing → works at any GitHub Pages path. |
| TR-2 | ✅ | localStorage with versioned schema + normalizing migration. |
| TR-3 | ✅ | No assets to stutter; audio scheduled with a lookahead scheduler; DPR-capped canvas. |
| TR-4 | ✅ | Service worker: cache-first hashed assets, network-first shell with offline fallback. |
| TR-5 | 🟡 | Responsive, touch-first, safe-areas; matrix testing on real tablets pending. |
| TR-6 | ✅ | Start tap unlocks AudioContext; player retries unlock on first in-lesson gesture; resume handling. |
| TR-7 | ✅ | Photos downscaled client-side to ≤512 px JPEG; stored locally; removable (PV-5). |
| TR-8 | ✅ | A broad unit/safety/a11y suite; the safety suite is the priority class and gates deploy in CI. |
| TR-9 | 🟡 | CI-enforced payload budgets (scripts/check-budgets.mjs; the JS bundle stays comfortably under budget, zero per-lesson fetches) + an in-player diagnostics overlay (?diag=1) and a scripted on-device soak protocol (docs/perf-budgets.md). The hardware runs themselves are the remaining human step. |
| TR-10 | 🟡 | Automated: axe (all pages), contrast tests, keyboard-operable controls, scanning unit + E2E tests. docs/at-walkthrough.md scripts the manual AT passes; running them on hardware is the remaining human step. |

## §10 Privacy

PV-1 ✅ (nickname-only, copy discourages real names) · PV-2 ✅ (no network after load, no analytics) ·
PV-3 ✅ (optional PIN, honestly framed as a courtesy lock) · PV-4 ✅ (export dialogs state contents;
downloads are local) · PV-5 ✅ (photos listed, removable, never transmitted; Children page also offers a guarded full erase of
all on-device data, localStorage and media blobs alike).

## §11 Caveats carried forward

- Companion-not-curriculum framing runs through all copy. ✅
- No accounts/cloud; adding them later would trigger new privacy work. ✅ (none added)
- Glow framed as vision-professional-coordinated, off-able. ✅
- **Validation expectation surfaced, not assumed away:** this build has **not** had vision-professional/clinical review or
  family usability testing. That review, across content, copy, and the safety analysis assumptions
  (e.g., the luminance model’s halo weighting), is the gate between "prototype" and "recommendable".
