import { useEffect, useRef, useState } from 'preact/hooks';
import { Card } from './grownups/bits';

/**
 * A public "what is this" page for anyone who lands on the app without knowing
 * what it is: a curious visitor, a clinician weighing it up, or a parent sent
 * the link. It sits *before* the grown-up gate on purpose. The gate keeps
 * children out of caregiver data and settings; it was never meant to keep an
 * adult from reading an explanation, so this content is open.
 *
 * The copy is a distilled subset of README.md (the source of truth), so keep
 * the two roughly in step. Companion-not-curriculum framing (SR-4), no
 * diagnostic/clinical language, and no em dashes, same as everywhere else.
 *
 * Not linked from anywhere yet, by design: reachable only at #/about while we
 * decide how prominent its "door" on the child screens should be.
 */
export function About() {
  const ref = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    // Send a screen reader to the top heading on arrival, but keep the top bar in
    // view for everyone else: preventScroll moves focus without jumping the page (AR-6).
    ref.current?.querySelector('h1')?.focus?.({ preventScroll: true });
  }, []);

  // Sharing keeps the app's no-network promise: it opens the native share sheet,
  // or copies the link where no sheet exists, and sends nothing itself. The link
  // shared is this page, so whoever receives it lands on this same explanation.
  const share = async () => {
    const url = location.href;
    const data = {
      title: 'The Light & Sound App for Kids with CVI',
      text: 'Gentle light-and-sound lessons for children with CVI, from babies to teens.',
      url,
    };
    if (navigator.share) {
      // A cancelled share rejects; that is a normal outcome, not an error.
      try {
        await navigator.share(data);
      } catch {
        /* dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      /* no share sheet and no clipboard (an insecure context); nothing to do */
    }
  };

  return (
    <main class="about-screen" ref={ref}>
      {/* A slim top bar echoing the grown-up pages (brand left, actions right), so
          this public page reads as part of the same app. The actions ride up here,
          visible without scrolling; a reader who reaches the end still finds a
          "Go to the app" waiting there too. */}
      <header class="about-top">
        <p class="about-brand">Light &amp; Sound</p>
        <div class="row">
          <a class="btn btn-small btn-primary" href="#/">
            Go to the app
          </a>
          <button type="button" class="btn btn-small" onClick={share}>
            <ShareIcon />
            Share
          </button>
          {/* Feedback for the clipboard fallback only; the native share sheet gives
              its own. role=status announces it without stealing focus. */}
          <span class="about-copied" role="status" aria-live="polite">
            {copied ? 'Link copied' : ''}
          </span>
        </div>
      </header>
      <div class="stack">
        <div class="about-intro">
          <h1 tabindex={-1}>The Light &amp; Sound App for Kids with CVI</h1>
          <p class="about-lede">
            Gentle light-and-sound lessons: a calm, tappable companion that helps babies through teens
            practise looking and listening, at whatever pace and intensity suits them.
          </p>
        </div>

        <Card title="What this is">
          <p>
            Light &amp; Sound gives a child one warm thing to notice on a black screen, lets them make it
            respond, and slowly, only if it helps, adds a little more to look at. It runs entirely in the
            browser, with no accounts and no servers, and nothing ever leaves the device. You can install it
            to a home screen, where it opens full-screen like an app and keeps working offline.
          </p>
          <p class="card-note">
            It was built by Claude Fable 5 as a demonstration of the model, pointed at a real problem. It is
            an intermittently-developed side project that has not had a clinical review, so please treat it as
            a gentle companion to use alongside a child's vision team, rather than a clinically validated tool.
          </p>
        </Card>

        <Card title="What CVI is, briefly">
          <p>
            CVI (cortical or cerebral visual impairment) is the most common cause of childhood visual
            impairment in much of the world. The eyes often work fine; it is the brain's visual processing
            that needs gentle, repeated, low-clutter practice. Importantly, vision with CVI can develop, and
            every child's CVI is different, which is why almost everything here is adjustable.
          </p>
        </Card>

        <Card title="Who it is for">
          <ul>
            <li>
              <b>Parents and caregivers:</b> a quiet activity you tune to your child, in their own colours,
              with your own photos and voice. Nothing to sign up for, nothing to leak.
            </li>
            <li>
              <b>Vision therapists and early-intervention teams:</b> a companion between sessions, with a
              lesson-by-lesson walk-through and an exportable summary. It supports your programme; it never
              assesses or replaces it.
            </li>
            <li>
              <b>Anyone simply curious:</b> a small, careful project you are welcome to look around.
            </li>
          </ul>
        </Card>

        <Card title="What it does">
          <p>
            Dozens of lessons across four gentle levels, from noticing a single warm light to finding a
            familiar face among others, plus listening-only lessons where hearing is a goal in its own
            right. Everything is drawn live and scored by a synthesizer, with no image or audio files at
            all, so the whole app is a tiny download.
          </p>
          <p class="card-note">
            You can personalise colour, size, speed, brightness, and sound; add your own photos and voice
            recordings as targets; and build custom lesson sequences. Three age bands re-present the same
            practice appropriately, so a teenager never meets a duckling or a nursery rhyme. One-switch and
            two-switch access are built in.
          </p>
        </Card>

        <Card title="Safety is the whole point">
          <p>
            Flashing light can trigger seizures, so safety here is not a promise, it is enforced by code and
            proven by tests. Every animation flows through one small kernel that keeps changes slow, forbids
            fast fades, caps how far brightness can swing, and rate-limits the reward moments. The test suite
            then replays every lesson frame by frame, at ordinary and extreme settings, and measures the
            result against flash-safety thresholds.
          </p>
        </Card>

        <Card title="Your privacy">
          <p>
            Everything (profiles, settings, notes, photos, recordings) lives only in this browser on this
            device. Nothing is uploaded, there are no analytics and no accounts, and there are no network
            calls after the page loads. Exports are explicit local file downloads, clearly flagged as
            containing personal information about a child.
          </p>
        </Card>

        <Card title="A note on framing">
          <p class="card-note">
            Light &amp; Sound is a companion, not a curriculum. It supports, and never replaces, a child's
            vision professional or early-intervention team, and it deliberately contains no assessments,
            scores, or diagnostic output of any kind.
          </p>
        </Card>

        <div class="about-doors">
          <a class="btn btn-primary" href="#/">
            Go to the app
          </a>
        </div>
      </div>
    </main>
  );
}

/** An upward arrow rising from a tray, the near-universal "share" glyph, drawn
 *  in the same hand as the gate's home icon. */
function ShareIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 15V4" />
      <path d="M8 8l4-4 4 4" />
      <path d="M6 12v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}
