# CVI Vision & Hearing Training Site — Requirements Brief

**Purpose:** A lightweight static website offering a progression of short lessons that pair simple, controllable visuals with songs, to support vision and hearing development in children with Cortical/Cerebral Visual Impairment (CVI). Lessons are highly tailorable so a parent or vision professional can match content to an individual child.

**Audience for this document:** design and build team (human or AI agent).

**Status:** High-level requirements for the design and build team. Individual visual/UX decisions are delegated within the constraints below.

---

## 1. Guiding principles

These shape every decision downstream and should be treated as the "why" behind the specific requirements.

- **Personalization is core, not a feature.** CVI presents very differently child to child; the "right" color, pace, and complexity are individual. The product's value depends on being tunable along the axes in Section 5.
- **Progression follows CVI development.** Lessons are organized from building basic visual attention → integrating vision with function → handling visual complexity (loosely mirroring the phases in Roman-Lantzy's CVI Range). This gives the lesson library a principled order rather than a random playlist.
- **Calm, uncluttered, full-screen.** The target should never compete with menus, borders, or decoration. Reducing visual complexity is itself a therapeutic requirement.
- **Companion tool, not a curriculum.** The product supports — and does not replace — a child's TVI (Teacher of Students with Visual Impairments) or vision professional. Copy and framing should reflect this.
- **Vision and hearing are distinct goals that sometimes compete.** Many CVI children cannot attend to vision and hearing at once; sound can pull attention *off* a visual target. Pairing is valuable but must be optional and controllable (see FR-6, PR-11), and hearing deserves development in its own right (see CR-5), not only as a servant to vision.
- **Graceful use without a professional.** TVIs are scarce in many regions, so a meaningful share of families will use this with no professional in the loop. The product should stay safe and usable in that case (see PT-12) while still steering people toward professional support — this is an equity consideration, not a reason to become a curriculum.
- **Serve every age with dignity.** The product spans birth to teens (CR-6). Crucially, *developmental age* and *visual phase* are independent: an older child or teen at an early visual phase needs the same simple, high-salience target as an infant, but never the same babyish theme, music, or tone. Meeting the whole age range respectfully — not toddler-first — is a core design aim.

---

## 2. Site structure & navigation

- **FR-1 — Two entry points.** A calm landing page with a large, simple **Start (child)** door and a smaller, tucked-away **For grown-ups (parent/caregiver)** area.
- **FR-2 — Full-screen lesson player.** Each lesson runs full-screen and distraction-free: no menus, borders, or clutter competing with the target.
- **FR-3 — High-contrast, forgiving navigation.** All navigation between lessons uses large, high-contrast, generously spaced hit targets (see Accessibility, Section 7).
- **FR-4 — Lesson library.** Lessons are browsable/selectable from the grown-up area and grouped by level (Section 4). A parent can pin or favorite specific lessons for reuse.
- **FR-5 — Graceful exit.** A child cannot get "stuck"; there is always a simple, forgiving way back out of a lesson (and a way for a grown-up to exit that a child won't trigger accidentally).
- **FR-11 — Grown-up exit stays reachable for disabled caregivers.** The "child won't trigger it accidentally" exit (FR-5) must not become an exit a *motor-impaired or switch-using caregiver* can't perform either. The grown-up exit/controls must be operable by the same accessibility paths as the rest of the grown-up UI (Section 7).

---

## 3. Lesson experience (per lesson)

- **FR-6 — Visual + audio pairing, with a visual-only path.** Each lesson pairs a controllable visual element with a song or sound *by default*, **but** the app must also support (a) a fully **visual-only** mode (audio off) to elicit a visual response when sound competes for attention, and (b) audio delivered as a **sequential reward after** a look/response rather than always concurrently. (Pairing remains the default; the visual-only and reward-after modes are additions. Ties to PR-11.)
- **FR-7 — Slow, latency-aware pacing.** Transitions are slow and the app allows for delayed responses (visual latency). No requirement to respond quickly; nothing auto-advances faster than the configured pacing allows.
- **FR-8 — Smooth transitions only.** Appearances, disappearances, and movement use fades/eases, never hard cuts or abrupt flashes (see Safety, Section 8).
- **FR-9 — Cause-and-effect option, within safety bounds.** At least one early lesson type supports simple interaction: a "tap anywhere" input produces a rewarding visual + audio response (supports visually guided reach). The reward itself must obey the smoothness, brightness, and no-strobe constraints (FR-8, SR-2, SR-3, SR-6) — a reward is not an exception to the safety rules and must not be a sudden bright burst. The cause-and-effect input must also be operable via single switch, not only touch (AR-8).
- **FR-10 — Optional sound-target binding.** Where appropriate, a target's sound can be co-located with and follow the target's on-screen position (binds vision and hearing).
- **FR-12 — Distress / aversion handling.** The design must not assume that on-screen engagement equals tolerance. Provide an immediate, gentle way to pause, dim, or exit if a child shows distress or over-stimulation, and never "push through" via auto-advance. Fatigue is handled separately (PT-6); this covers in-the-moment aversion.

---

## 4. Content & lesson progression

Four levels, each a phase of visual development. The build team should treat these as a content framework to populate, not a fixed final list. Levels set a *ceiling*, not a floor: every child is met at their own level via personalization (Section 5), so extending the top of the range never makes the early, calm experiences any busier.

**Level 1 — Build attention** (single target, plain black field)
- One glowing element on plain black, paired with a single-instrument song.
- Examples: gently pulsing red circle with a soft lullaby; twinkling yellow star with a "Twinkle Twinkle" instrumental; a light slowly drifting across screen for tracking; tap-anywhere cause-and-effect with a chime.
- Emphasis on light and movement as attention magnets; slow pacing.

**Level 2 — Integrate & track** (gentle choice and simple meaning)
- Target moving along a path with its sound following it.
- Two elements where one lights up to invite a look/tap.
- A single familiar object (e.g., red ball, yellow duck) on a still-simple background with matching sound.
- Backgrounds may gain slight texture but stay simple.

**Level 3 — Complexity & the real world**
- Real photos of animals/objects on gradually busier backgrounds.
- "Find the item" in a mildly cluttered scene.
- Illustrated nursery rhymes with fuller, layered songs.
- Builds toward distance viewing and visual novelty.

**Level 4 — Advanced / higher-order vision** *(most relevant to older or more-developed children)*
- Genuinely busy, real-world visual environments and visual search under real clutter (visual crowding).
- Higher-order tasks: discriminating and recognizing faces; near/far and distance shifts; following a moving target among distractors (within safe, latency-aware pacing).
- Visually-guided, functional real-world tasks relevant to an older child (e.g., locating an object at a distance, navigating a cluttered scene).
- Age-respecting imagery and music for teens rather than nursery content.
- Challenge comes from *visual demand*, never from speed spikes, flashing, or abrupt change: all Section 8 safety constraints apply unchanged at this level.

- **CR-1 — Reusable themes across levels.** Themes (e.g., Stars, Rain, Ocean, Animals, Balloons, Fireflies) should scale from a single glowing element (L1) up to a full, busy scene (L4).
- **CR-2 — Asset discipline.** All visual and audio assets are optimized/tiny and preloaded per lesson so playback never stutters (see Technical, Section 9).
- **CR-3 — Custom / personal assets.** Allow a parent or TVI to supply the child's *own* motivating content as a target — e.g., a favorite song, a photo of a beloved toy or object, or a familiar caregiver's face (faces are both a known CVI difficulty and strongly motivating). Given PR-9 (familiarity), this may be the single most engaging feature. **Constraint:** it introduces *local* personal data, so such assets must be processed and stored **on-device only** (TR-7) and are covered by the privacy requirements (Section 10) — no upload, no transmission.
- **CR-4 — 2D → 3D bridge.** Because functional vision ultimately happens with real objects, relevant lessons should include an optional prompt for the grown-up to pair the on-screen target with the corresponding **real 3D object** (e.g., show the red ball on screen, then hand the child a real red ball). This extends the tool's reach toward function without adding screen complexity.
- **CR-5 — Auditory-development content.** Provide at least some content where listening attention, sound localization, or simple sound discrimination is a *goal in its own right*, not merely a visual reward or locator. Supports the "Hearing" half of the product and children whose hearing channel is a relative strength.
- **CR-6 — Age range & tone.** **Intended age range: birth to teens.** CVI intervention spans this whole band, and an older child at an early visual phase still needs phase-appropriate but not *babyish* material. The content framework must (a) serve the low-vision-phase needs of older children with age-respecting tone and imagery wherever the range extends beyond toddlers, and (b) scale to a genuinely higher challenge ceiling for older or more-developed children (see CR-8), rather than capping out at gentle early-phase content.
- **CR-7 — Readiness cues (content side).** For each level, the content framework should define lightweight "signs a child may be ready to move up / may need to step back" cues, so the grown-up guidance in PT-10 has something concrete to surface. (Framework-level; specifics delegated to content/clinical input.)
- **CR-8 — Higher challenge ceiling.** The product must be able to challenge a child who has progressed, not cap out at gentle early-phase content. The difficulty axes — complexity/clutter (PR-3), size and viewing distance (PR-6), visual crowding, novelty (PR-9), and target movement/tracking within safe pacing (PR-2, PR-5) — must scale up to the Level 4 regime so challenge is tunable to the top of the age range (CR-6). This raises the *ceiling* only: personalization still meets each child at their own level, and every Section 8 safety constraint holds unchanged at maximum challenge.
- **CR-9 — Phase and age are independent axes.** Organize content as a grid of *visual phase* (Levels 1–4) × *age band* (e.g., infant / young child / older child / teen). Any phase must be deliverable in an age-appropriate rendering, so a teen working at Level 1 gets a simple, high-salience target presented with age-respecting theme, imagery, and music — not a cartoon duck. This decoupling is what lets one product genuinely serve birth to teens.
- **CR-10 — Age-appropriate aesthetics, audio, and tone.** Per age band, provide fitting visuals, music, reward style, and child-facing framing: playful and nursery-flavored for the youngest (the duck / nursery-rhyme examples above are *one band's* rendering, not the default); calm and neutral for a middle band; dignified, contemporary, and non-infantilizing for older children and teens. Younger bands must also avoid over-stimulation. Nothing about age band may relax the Section 8 safety constraints.
- **CR-11 — Content breadth across the grid.** Provide enough content in each (phase × age-band) cell that no child is left with only a handful of ill-fitting lessons. Prioritize the historically underserved cells — older children and teens at early visual phases — since generic CVI content skews toward young children. (Framework-level target; specifics delegated to content/clinical input.)

---

## 5. Personalization (the heart of the product)

Each axis below corresponds to a documented way CVI affects vision and varies per child. Expose each as a controllable setting.

- **PR-1 — Target color.** Parent selects the target color (defaults toward red/yellow but fully changeable) *and* can control background.
- **PR-2 — Movement.** Movement on/off and speed.
- **PR-3 — Complexity.** Background busyness and number of on-screen elements; scales from "single object on black" upward.
- **PR-4 — Visual field bias.** Ability to bias where targets appear on screen (e.g., favor lower field or a stronger side) for children who reliably miss a region.
- **PR-5 — Pacing / latency.** How slowly things transition and how long the app waits before advancing.
- **PR-6 — Size / distance proxy.** Adjustable target size (larger = easier; stands in for distance-viewing difficulty).
- **PR-7 — Brightness / light.** Adjustable brightness of glowing/backlit elements.
- **PR-8 — Audio.** Volume; single-instrument vs layered sound; sound-to-target binding on/off (per FR-10).
- **PR-9 — Novelty vs familiarity.** Allow reuse of a favorite/familiar target rather than forcing new content.
- **PR-10 — Presets first, fine-tuning second.** Offer a few starting profiles (e.g., "very early / single target," "building tracking," "handling complexity") so a parent isn't faced with many sliders on day one; individual axes are adjustable from there.
- **PR-11 — Audio–visual competition control.** Because sound can pull attention off a visual target for many CVI children, expose the ability to *reduce or remove* audio to elicit a visual response, and to schedule sound *after* a look rather than concurrently. Implements the settings side of FR-6.
- **PR-12 — Guided setup / preset recommendation.** PR-10 offers presets but not *which one*. Provide a short, plain-language guided setup (e.g., "Is there a color they're drawn to? Do they notice things more when moving? One object at a time, or can they handle a couple?") that recommends a starting preset. A newly diagnosed parent often can't name their child's phase unaided.
- **PR-13 — Light without light-gazing.** Glowing/backlit targets help many children but can reinforce non-purposeful *light-gazing* in others (a behavior TVIs work to reduce). Brightness/glow (PR-7) must be adjustable *down to a non-glowing target*, and copy should frame glow as TVI-coordinated, not universally beneficial (see Section 11).
- **PR-14 — Age band as a profile setting.** Capture the child's developmental age band in the profile (or via the guided setup, PR-12), independent of visual phase and preset. It drives age-appropriate themes, audio, reward style, and child-facing tone (CR-9, CR-10), so the same phase can be presented respectfully at any age.

---

## 6. Parent / caregiver tooling

- **PT-1 — Multiple child profiles.** Support more than one child per device (families and therapists may serve several children).
- **PT-2 — Persist settings.** Each profile's settings persist between sessions.
- **PT-3 — Export / import profiles.** Because static-site storage is tied to one browser, provide export/import so a profile survives a device change and can be shared with a child's TVI/vision teacher.
- **PT-4 — Lightweight session observation.** Simple per-session capture (e.g., "did they respond?" plus an optional note) to help tune settings over time.
- **PT-5 — Settings-review prompt.** A gentle periodic prompt to revisit settings, since CVI typically changes over months.
- **PT-6 — Session timing & fatigue awareness.** Short session timers and a fatigue-aware nudge, since visual effort tires these children quickly. Sessions should stay short by design.
- **PT-7 — Actionable session summaries.** Aggregate PT-4 observations into a simple, readable trend or summary (not just raw logs), and make it exportable in a form a TVI can actually interpret. This closes the loop with PT-5 (the review prompt should reference what the summary shows), so observation leads somewhere.
- **PT-8 — Session context tagging.** CVI function fluctuates day to day with fatigue, illness, seizures, and medication; a child can do worse on a given day without regressing. Let the grown-up tag a session with light context (e.g., tired / unwell / post-seizure / good day) so summaries (PT-7) aren't misread as decline. Supports the caregiver practically and emotionally.
- **PT-9 — Custom program composition.** Beyond favoriting (FR-4), allow a parent or TVI to assemble and order a **custom sequence** of lessons into a named program for a specific child. This is what makes the tool clinically usable across different CVI frameworks (e.g., a TVI working from a dorsal/ventral-stream model rather than a phase model) instead of locking everyone into the level order.
- **PT-10 — Readiness-to-advance guidance.** Surface the CR-7 readiness cues to the grown-up so they know roughly *when to move up or step back a level*, preventing a child from being parked on content that is too hard or too easy for weeks.
- **PT-11 — Environment / setup guidance.** Provide brief, plain-language setup guidance in the grown-up area on the *physical* conditions that determine whether the on-screen design works: room lighting and glare, screen brightness, viewing distance, and the child's seating/positioning (CVI co-occurs heavily with motor/postural needs). This is guidance content, not device control.
- **PT-12 — Minimal "no-TVI" orientation.** For families with no professional in the loop, offer brief, plain-language orientation — a high-level "what CVI is," "what a positive response looks like," "when to stop a session," and encouragement to seek a professional. It must be framed as *orientation and support*, never as instruction or a program, to stay on the right side of "companion, not curriculum."
- **PT-13 — Field-pattern observation (non-diagnostic).** Optionally extend the PR-4 mechanism so the app can present targets across screen regions/quadrants and log where the child does and doesn't reliably respond, in order to (a) help *tune* field bias (PR-4) and (b) produce observations a caregiver can *share with* a TVI/vision professional. Results are surfaced only in the grown-up area. This is a support-and-tuning aid, **not** an assessment or diagnosis: it is subject to the hard non-diagnostic constraints in SR-7, must draw on repeated sessions with context (PT-7, PT-8) rather than treating any single session as conclusive, and stays optional. Extra caution applies for families using the tool without a professional (PT-12).

---

## 7. Accessibility requirements

- **AR-1 — Large, forgiving targets.** Interactive targets and controls are large and generously spaced; interaction favors "tap anywhere" over precise pointing (many CVI children have co-occurring motor challenges).
- **AR-2 — Switch accessibility.** Interactive elements should support single-switch scanning access. Design for this from the start rather than retrofitting.
- **AR-3 — Touch-first.** Assume tablet/touch as the primary input; ensure hit areas suit imprecise touch.
- **AR-4 — High contrast throughout.** Navigation and grown-up UI maintain strong contrast.
- **AR-5 — Grown-up UI is clear and low-stress.** The caregiver area should be plain-language and not overwhelming; complexity lives behind presets (PR-10).
- **AR-6 — Grown-up UI meets standard accessibility.** The child side is deliberately non-standard, but a caregiver or reviewing TVI may themselves be blind or low-vision. The grown-up area should meet ordinary accessibility standards (target WCAG 2.1 AA): screen-reader labels, sensible focus order, and full keyboard operability.
- **AR-7 — Dual-sensory support.** CVI co-occurs with hearing loss. Provide a fully **visual-only** path *and* a path that does not depend on hearing, plus at least one **non-auditory feedback channel** (e.g., haptic/vibration where the device supports it) so cause-and-effect and rewards (FR-9) still land for a child who can't hear them.
- **AR-8 — Switch-scanning depth.** Refining AR-2: scan/step timing must respect the latency setting (PR-5); the scanning highlight/indicator is itself a visual stimulus and must follow the low-complexity and smooth-transition rules (FR-8, PR-3); and cause-and-effect/reward lessons must be operable by switch, not only touch.

---

## 8. Safety requirements (hard constraints — non-negotiable)

- **SR-1 — No hazardous flashing.** Seizure disorders are a common CVI comorbidity. Prohibit flashing/flicker in the risky range (approximately 3 Hz and above). This is a hard constraint on all visuals.
- **SR-2 — Smooth transitions mandatory.** Use fades and eased transitions instead of hard cuts (reinforces FR-8) — both for safety and for CVI-appropriate pacing.
- **SR-3 — Brightness bounds.** Even at maximum brightness (PR-7), avoid strobing or aggressive luminance changes.
- **SR-4 — Professional-companion framing.** Product copy must present the tool as something to use alongside a child's vision professional, not as a standalone program.
- **SR-5 — Photosensitivity beyond frequency.** Frequency (SR-1) is not the only trigger. Also avoid high-contrast static or oscillating **patterns** (e.g., stripes, checkerboards), large-area **saturated-red** flashing specifically, and account for the role of screen **area** and **luminance** — all relevant as Level 3 backgrounds get busier. Widen the SR-1 check accordingly rather than treating Hz alone as sufficient.
- **SR-6 — Interaction/reward bursts obey the same rules.** Cause-and-effect responses, rewards, and any "celebration" animation (FR-9) are covered by SR-2, SR-3, and SR-5. No interactive moment may introduce a strobe, hard cut, or aggressive luminance jump.
- **SR-7 — Non-diagnostic guardrails for field-pattern observation.** The PT-13 feature must never present its output as a diagnosis, clinical result, score, severity, pass/fail, or normative comparison, and must not use clinical deficit language (e.g., "field loss," "defect," "impairment in X region"). Output is descriptive, tentative, and session-bound (e.g., "targets on the lower-left were noticed less often this session"), is always paired with the reminder that a single session is affected by fatigue, latency, and mood, and always routes interpretation to the child's vision professional (reinforces SR-4). No output may recommend changing the child's medical care.
- **SR-8 — Safety constraints must be verified, not just designed.** The flashing/flicker prohibition (SR-1), brightness bounds (SR-3), and pattern/luminance limits (SR-5) must be enforced and checked programmatically and covered by automated tests (TR-8) — not merely intended in design. For a seizure-prone population these are safety-critical and must be demonstrably met on every lesson and at every setting, including maximum brightness and the busiest Level 4 scenes.

---

## 9. Technical requirements

- **TR-1 — Static site.** Lightweight, static hosting; no server-side dependency required for core function.
- **TR-2 — Local persistence.** Use browser storage (e.g., localStorage) for profiles/settings, with export/import to overcome its single-browser limitation (per PT-3).
- **TR-3 — Performance.** Assets are tiny, optimized, and preloaded per lesson; no stutter or jank during playback, including audio.
- **TR-4 — Offline-friendly (desirable).** Lessons should ideally run reliably with intermittent connectivity once loaded.
- **TR-5 — Cross-device.** Works well on tablets and standard browsers; layout adapts to touch and varied screen sizes.
- **TR-6 — First-interaction media unlock.** Browser autoplay policies commonly block audio (and some media) until a user gesture occurs. Plan an explicit first-interaction unlock so "tap → sound plays" (FR-9) and offline audio work reliably rather than silently failing on first use.
- **TR-7 — Custom-asset handling (for CR-3 custom assets).** Any user-supplied images/audio must be processed and optimized **client-side** to meet asset discipline (CR-2), and stored **locally only** with no upload or transmission — preserving the static, no-server, and privacy posture (Section 10).
- **TR-8 — Automated testing.** The build includes an automated test suite, with priority on the safety-critical behavior (no flashing in the risky range, smooth/eased transitions, brightness and luminance bounds — see SR-8) and on correct rendering across devices and screen sizes (TR-5). Automated coverage of the safety-critical behavior is a required deliverable.
- **TR-9 — Measured performance budgets.** Define concrete, testable budgets (asset sizes, load/preload times, no dropped frames, gap-free audio) so "no stutter or jank" (TR-3) is *measured*, not assumed — verified per lesson and on lower-end tablets, within the static-site constraint (TR-1).
- **TR-10 — Accessibility conformance and testing.** The grown-up UI meets a formal standard (target WCAG 2.1 AA; reinforces AR-6), verified with both automated and manual checks, including keyboard operation and single-switch scanning (AR-8). Conformance is demonstrated, not assumed.

---

## 10. Privacy & data handling (child users)

Profiles, notes, session observations, and any custom assets are personal data *about a disabled child*, held locally — including on shared family tablets and, especially, on a therapist's device serving many families. These are proportionate, local-only requirements, not a cloud/consent regime.

- **PV-1 — Data minimization.** Store only what the child's experience needs. Avoid identifying data such as full legal name or date of birth; a nickname/label is sufficient to distinguish profiles.
- **PV-2 — Local-only by default.** Profiles, settings, observations (PT-4/PT-7), and custom assets (CR-3) are not uploaded or transmitted anywhere, consistent with TR-1/TR-2. Nothing is auto-sent.
- **PV-3 — Shared-device confidentiality.** On a device serving multiple children, one child's data (settings, notes, photos) should not be casually exposed to whoever next opens the browser. Provide at least lightweight separation/locking for the grown-up area and its observations.
- **PV-4 — Export transparency.** Exports (PT-3/PT-7) contain personal information about a child. Make that clear at the point of export, and keep exports local and shared at the caregiver's discretion — never transmitted automatically.
- **PV-5 — Personal media stays on-device.** Personal photos/faces/recordings supplied for custom assets (CR-3) remain on-device, are clearly listed, and are easily removable by the caregiver.

---

## 11. Out of scope / caveats to carry into the build

- The product is a supportive tool, not a diagnostic or a replacement for professional CVI intervention. It should be used alongside the child's TVI or intervention plan.
- CVI frameworks vary and the "right" settings are individual; the product deliberately exposes tuning rather than prescribing a single correct configuration.
- No accounts, cloud sync, or server-side personal-data *collection* are assumed in this brief. Local personal data does exist (Section 10) and is handled there; a future move to cloud/accounts would introduce additional privacy obligations (especially given child users) that would need their own requirements.
- **Glowing targets are not universally beneficial.** For some children, glow reinforces non-purposeful light-gazing. Copy and defaults should present glow as one TVI-coordinated option (PR-13), not a recommendation for every child.
- **Field-pattern observation is non-diagnostic by design.** The PR-4 mechanism can be extended to surface where a child does and doesn't respond across the screen (PT-13). It is in scope on the condition that it informs tuning and professional conversations only and never diagnoses, labels, or scores the child (SR-7). The caution here is a standing requirement, not a one-time check — especially for families using the tool without a professional.
- **Validation is expected, not optional.** Given the stakes and the specialized population, plan for expert TVI/clinical review of content and safety, and usability testing with actual CVI children **across the full age range (infants through teens)**, **before and after** build. This is a process expectation the build agent should surface, not assume away.
