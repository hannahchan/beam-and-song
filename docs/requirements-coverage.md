# Requirements coverage — v1 (infant scope)

Status of every requirement ID from `CVI-training-site-requirements-final.md` in this build.
**Scope decision:** v1 serves infants (~birth–18 months). Requirements that only bite for older
children are deliberately deferred, not forgotten — they shape the architecture (themes are reusable,
phase and rendering are decoupled in lesson specs, levels are data not code).

Legend: ✅ done · 🟡 partial · ⏭ deferred (with reason) · ∅ n/a at infant scope

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
| FR-6 | ✅ | Three sound modes: with / **after a look** (tap-to-answer) / off. |
| FR-7 | ✅ | Pace axis multiplies all durations; nothing ever auto-advances faster than configured; session ends in a rest screen, not more content. |
| FR-8 | ✅ | Kernel enforces ≥500 ms eased fades; verified by simulation (a hard cut was caught and fixed in development). |
| FR-9 | ✅ | Magic Touch + interactive responses in 4 lessons; tap-anywhere; Space/Enter = switch input; rewards obey all safety caps under input mashing (tested). |
| FR-10 | ✅ | StereoPanner follows target x; per-profile toggle; hearing lessons pan by design. |
| FR-12 | ✅ | Pause overlay dims + hushes instantly; "Softer" mode halves light/sound; End is always two taps away; auto-pause when the tab hides. |

## §4 Content & progression

| ID | Status | Notes |
|---|---|---|
| L1/L2 content | ✅ | 6 + 6 lessons. |
| L3/L4 content | ⏭ | Beyond infant v1; specs/themes designed to extend. |
| CR-1 | ✅ | Stars/Fireflies/Light/Rain/Familiar-things themes recur across levels. |
| CR-2 | ✅ | No binary assets at all — visuals procedural, audio synthesized; ~35 KB gzipped app. |
| CR-3 | ✅ | Photo targets: client-side downscale → data URL in the profile; on-device only; drives the photo lesson. Custom **audio** deferred. |
| CR-4 | ✅ | Bridge prompts on ball/duck/photo/touch lessons, surfaced in the library cards. |
| CR-5 | ✅ | Two listening-first lessons + "Listening first" preset. |
| CR-6 | ✅ | Three bands (infant / child / teen) selectable per profile and in guided setup. |
| CR-7 | ✅ | Readiness cues per lesson ("watch for") + move-up/step-back guidance in the Guide. |
| CR-8 | ⏭ | Higher challenge ceiling comes with L3/L4. |
| CR-9 | ✅ | Band re-skins theme/music/copy only — behavior, level, interactivity provably unchanged (tested). A teen at Level 1 gets "Ember", not a duck. |
| CR-10 | ✅ | Full teen re-skin (ambient melodies composed as note data; boat/ember/orbit themes); child band = warm content with adjusted wording; a build-breaking test bans babyish language/imagery/nursery tunes from teen output. |
| CR-11 | 🟡 | Teen row covers Levels 1–2 + listening (14 re-skinned lessons); breadth grows with L3/L4. |

## §5 Personalization

PR-1…PR-14: **all implemented** — colour+background (PR-1), movement/speed (PR-2), complexity (PR-3),
field bias incl. strength (PR-4), pace (PR-5), size (PR-6), brightness (PR-7), audio volume/texture/binding
(PR-8), favorites-first novelty control (PR-9), presets (PR-10), audio-competition modes (PR-11), guided
setup (PR-12), glow-to-zero with anti-light-gazing copy (PR-13), and the age band is implicit in v1 (PR-14 ∅ —
single band; the profile field becomes meaningful when more bands ship).

## §6 Parent/caregiver tooling

| ID | Status | Notes |
|---|---|---|
| PT-1/PT-2 | ✅ | Multiple profiles; instant persistence. |
| PT-3 | ✅ | Export/import JSON incl. photos & notes; collision-safe import. |
| PT-4 | ✅ | Ten-second observation card at session end (response + tags + note), fully skippable. |
| PT-5 | ✅ | Review nudge after >35 days & ≥8 sessions; "mark reviewed" button. |
| PT-6 | ✅ | Session timer (2–8 min) → gentle wind-down to a rest screen; "short and sweet" nudge on repeats. |
| PT-7 | ✅ | 4-week trend, response mix, top lesson, weekly bars (with text alternative), plain-text TVI summary export. |
| PT-8 | ✅ | Day-context tags; summaries call out that quiet hard-days are expected, not decline. |
| PT-9 | ⏭ | Custom ordered programs — next iteration; favorites ordering partially covers it. |
| PT-10 | ✅ | Guide section + per-lesson cues. |
| PT-11 | ✅ | Room/lighting/distance/positioning guidance in Guide + dashboard reminder. |
| PT-12 | ✅ | "What CVI is / what a response looks like / when to stop / find a professional" — orientation framing only. |
| PT-13 | ⏭ | Field-pattern observation deferred **on purpose**: needs careful SR-7-compliant design; infant tap data would be mostly parent-generated anyway. PR-4 tuning ships without it. |

## §7 Accessibility

| ID | Status | Notes |
|---|---|---|
| AR-1 | ✅ | ≥44–56 px targets everywhere; child side is tap-anywhere. |
| AR-2/AR-8 | 🟡 | All controls are semantic, keyboard-operable big buttons → OS switch scanning (iOS Switch Control etc.) works; lesson input accepts any key. A **built-in** auto-scanner with PR-5-aware timing is deferred; scanning indicators would then follow FR-8/PR-3 rules. |
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
| SR-7 | 🟡 | PT-13 deferred, so mostly moot; the language guard in spec validation + copy review keep all output descriptive. |
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
| TR-8 | ✅ | 124 tests; safety suite is the priority class and gates deploy in CI. |
| TR-9 | 🟡 | Asset budgets trivially met (≈35 KB total, zero fetches); frame-time measurement on low-end hardware pending. |
| TR-10 | 🟡 | Automated: axe (all pages) + contrast tests + keyboard-operable controls. Manual AT walkthrough pending. |

## §10 Privacy

PV-1 ✅ (nickname-only, copy discourages real names) · PV-2 ✅ (no network after load, no analytics) ·
PV-3 ✅ (optional PIN, honestly framed as a courtesy lock) · PV-4 ✅ (export dialogs state contents;
downloads are local) · PV-5 ✅ (photos listed, removable, never transmitted).

## §11 Caveats carried forward

- Companion-not-curriculum framing runs through all copy. ✅
- No accounts/cloud; adding them later would trigger new privacy work. ✅ (none added)
- Glow framed as TVI-coordinated, off-able. ✅
- **Validation expectation surfaced, not assumed away:** this build has **not** had TVI/clinical review or
  family usability testing. That review — across content, copy, and the safety analysis assumptions
  (e.g., the luminance model’s halo weighting) — is the gate between "prototype" and "recommendable".
