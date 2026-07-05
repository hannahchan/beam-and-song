# Assistive-technology walkthrough (TR-10): scripts & results

Automated checks (axe on every page, contrast tests, keyboard-operable controls, scanning
unit/E2E tests) run in CI. **This document is the human half**: scripted passes on real
devices with real assistive tech. Update the results tables as you run them, findings go
to `clinical-feedback.md` or issues.

Suggested hardware: an iPad (Safari/VoiceOver/Switch Control), any Android tablet
(TalkBack/Switch Access), and a laptop (NVDA on Windows or VoiceOver on macOS).

## Script A: keyboard only (any laptop)

1. Load the site. Tab: first stop should be the skip link, then Start, then "For grown-ups".
2. Enter on Start → chooser tiles reachable in order; Enter plays a lesson.
3. During the lesson: Space/Enter triggers the lesson response (Magic Touch), Escape opens
   the pause dialog, focus lands inside it, Tab cycles its three buttons, Enter on
   "End the session" → observation card fully operable → Save returns to the landing page.
4. Grown-ups gate: hold Space on "Press and hold" completes it; the word alternative also
   works with Tab+Enter.
5. Every settings control operable: swatches, radios, checkboxes, sliders (arrow keys),
   selects, the photo/audio file pickers, and every button in a program editor.
6. Nothing ever traps focus; the focus ring is always visible.

| Item | Pass? | Notes |
|---|---|---|
| A1–A6 | ☐ | |

## Script B: VoiceOver (iPad Safari)

1. Landing: elements announce sensibly ("Start, gentle lessons for your baby, button").
2. Chooser tiles announce "Play <lesson>, button".
3. Grown-up pages: headings navigable by rotor; sliders announce plain-word values
   ("Pace, Very slow"); groups/legends read before options; the weekly bars announce the
   text alternative.
4. The pause dialog announces as a dialog and traps the rotor sensibly.
5. Export/import controls have clear names; the PV-4 warning is read before download.

| Item | Pass? | Notes |
|---|---|---|
| B1–B5 | ☐ | |

## Script C: NVDA (Windows, Chrome or Firefox)

Same route as Script B; additionally check that the update toast (when present) is
announced politely (role=status) and the observation card reads as one coherent form.

| Item | Pass? | Notes |
|---|---|---|
| C | ☐ | |

## Script D: iOS Switch Control (external or screen switch)

1. With app scanning **off**: Switch Control's own scanner reaches every control on
   landing, chooser, gate, and grown-up pages (they are all native buttons/links).
2. During a lesson, a switch press mapped to Select Item on the full screen triggers the
   lesson response (tap-anywhere).
3. With app scanning **auto**: disable Switch Control; a single Bluetooth switch mapped
   to Space activates the highlighted control; ring pace feels unhurried at pace 1–2.
4. Ring never blinks or jumps without gliding; it disappears during a live lesson.

| Item | Pass? | Notes |
|---|---|---|
| D1–D4 | ☐ | |

## Script E: Android Switch Access + TalkBack spot-check

Mirror of D plus a TalkBack pass over Settings and the Guide.

| Item | Pass? | Notes |
|---|---|---|
| E | ☐ | |

## Script F: surfaces added after the original scripts (July 2026)

1. **Hold lesson** (Keep the Light Singing / Sustain): holding Space or Enter swells the
   light and hums; releasing settles it; Escape during a hold opens the pause dialog *and*
   the light lets go (never stuck lit). Same with a Bluetooth switch mapped to Space.
2. **Voice labels** (Settings → photos): "Record its name in your voice", "Add a voice
   file", Play, and Remove voice are all reachable and clearly announced per photo;
   recording state ("tap to finish") is perceivable without vision.
3. **Walk-through page** (Lessons → "walk through every lesson"): Previous/Next/slideshow/
   sound buttons operable by keyboard and switch; arrow keys page; the position counter
   ("n of N") is read when the card is revisited.
4. **Print pages** (Notes → print summary; Guide → off-screen kit): reachable, the Print
   button works, and the on-screen-only controls vanish on paper.

| Item | Pass? | Notes |
|---|---|---|
| F1–F4 | ☐ | |

## Known limitations (by design or deferred)

- Built-in scanning skips free-text fields (names, notes, PIN), those need the platform's
  own tools. Sliders are fully scannable via their −/+ stepper buttons.
- The child lesson screen is deliberately non-standard (FR-2): no focusable elements
  besides the corner pause button; the whole surface is the interactive target.
- Haptic rewards are unavailable on iPads (no web vibration API), the visual response
  carries the moment; noted in Settings copy.
