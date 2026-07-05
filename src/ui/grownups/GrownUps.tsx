import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import type { Route } from '../../lib/router';
import { checkPin, setActiveProfile } from '../../lib/store';
import { useStore } from '../useStore';
import { HoldButton } from './bits';
import { Dashboard } from './Dashboard';
import { Library } from './Library';
import { Settings } from './Settings';
import { Sessions } from './Sessions';
import { Profiles } from './Profiles';
import { Guide } from './Guide';
import { Setup } from './Setup';
import { PrintSummary } from './PrintSummary';
import { PrintKit } from './PrintKit';
import { Review } from './Review';

export const GATE_KEY = 'light-and-sound:grownup-ok';

/**
 * The grown-up area shell: child-resistant gate (FR-5), optional PIN (PV-3),
 * accessible navigation (AR-6), and the professional-companion framing that
 * belongs on every page (SR-4).
 *
 * The gate re-locks every time the app returns to the child screen (see App),
 * so it re-arms after every hand-over. When a PIN is set the PIN *is* the gate;
 * without one, the press-and-hold / tap-the-word challenge keeps small hands out.
 */
export function GrownUps({ route }: { route: Route }) {
  const state = useStore();
  const [open, setOpen] = useState(() => sessionStorage.getItem(GATE_KEY) === '1');
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Move focus to the page heading on route change (screen-reader sanity, AR-6).
    mainRef.current?.querySelector('h1')?.focus?.();
  }, [route.path]);

  if (!open) {
    return (
      <Gate
        hasPin={!!state.pinHash}
        onPassed={() => {
          sessionStorage.setItem(GATE_KEY, '1');
          setOpen(true);
        }}
      />
    );
  }

  const sub = route.path.replace(/^\/grown-ups\/?/, '') || 'home';
  const profile = state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0] ?? null;

  // The print views render without the app shell, clean on paper.
  if (sub === 'print') return <PrintSummary profile={profile} />;
  if (sub === 'print-kit') return <PrintKit profile={profile} />;

  const nav: Array<[key: string, href: string, label: string]> = [
    ['home', '#/grown-ups', 'Home'],
    ['library', '#/grown-ups/library', 'Lessons'],
    ['settings', '#/grown-ups/settings', 'Settings'],
    ['sessions', '#/grown-ups/sessions', 'Notes'],
    ['guide', '#/grown-ups/guide', 'Guide'],
    ['profiles', '#/grown-ups/profiles', 'Children'],
  ];

  return (
    <div class="gu-shell">
      <a class="skip-link" href="#gu-main">
        Skip to content
      </a>
      <header class="gu-top">
        <p class="gu-brand">Light & Sound · for grown-ups</p>
        <div class="row">
          {state.profiles.length > 1 && profile && (
            <label>
              <span class="sr-only">Which child</span>
              <select
                value={profile.id}
                onChange={(e) => setActiveProfile((e.target as HTMLSelectElement).value)}
                style={{ minWidth: '10rem', width: 'auto' }}
              >
                {state.profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname}
                  </option>
                ))}
              </select>
            </label>
          )}
          <a class="btn btn-small btn-primary" href="#/">
            Back to child screen
          </a>
        </div>
      </header>
      <nav class="gu-nav" aria-label="Grown-up pages">
        {nav.map(([key, href, label]) => (
          <a key={key} href={href} aria-current={sub === key ? 'page' : undefined}>
            {label}
          </a>
        ))}
      </nav>
      <main id="gu-main" ref={mainRef}>
        {sub === 'home' && <Dashboard profile={profile} />}
        {sub === 'library' && <Library profile={profile} />}
        {sub === 'settings' && <Settings profile={profile} />}
        {sub === 'sessions' && <Sessions profile={profile} />}
        {sub === 'guide' && <Guide topic={route.params.get('topic')} />}
        {sub === 'profiles' && <Profiles state={state} />}
        {sub === 'setup' && <Setup profile={profile} />}
        {sub === 'review' && <Review profile={profile} />}
      </main>
      <footer class="gu-footer">
        <p>
          Light & Sound is a companion to your child's vision professional or early-intervention team, not a
          programme, a curriculum, or any kind of assessment. Everything you save stays on this device only.
        </p>
      </footer>
    </div>
  );
}

function Gate({ hasPin, onPassed }: { hasPin: boolean; onPassed: () => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  // A stable per-visit challenge: a random target word shown among a shuffled
  // trio, so the answer neither shuffles under the finger nor stays the same
  // word every time the gate re-locks.
  const { target, words } = useMemo(() => {
    const pool = ['one', 'two', 'three'];
    return {
      target: pool[Math.floor(Math.random() * pool.length)],
      words: pool.slice().sort(() => (Math.random() < 0.5 ? -1 : 1)),
    };
  }, []);

  // A gentle, self-targeting deterrent for the tap-the-word fallback: a wrong
  // tap briefly disables the choices, and the pause grows with each consecutive
  // wrong tap (capped at 3 s), so a child mashing all three no longer gets in
  // instantly, while a grown-up who reads the word and taps it once never feels
  // a thing. It never touches the hold button, the PIN, or the way back out, so
  // the accessible entry (FR-11) and the child's exit (FR-5) stay unaffected.
  const [wordsLocked, setWordsLocked] = useState(false);
  const wrongStreak = useRef(0);
  const timers = useRef<{ unlock?: number; forgive?: number }>({});
  useEffect(
    () => () => {
      window.clearTimeout(timers.current.unlock);
      window.clearTimeout(timers.current.forgive);
    },
    [],
  );
  const onWrongWord = () => {
    wrongStreak.current = Math.min(wrongStreak.current + 1, 3);
    const pauseMs = wrongStreak.current * 1000; // 1 s, 2 s, then capped at 3 s
    setWordsLocked(true);
    window.clearTimeout(timers.current.unlock);
    timers.current.unlock = window.setTimeout(() => setWordsLocked(false), pauseMs);
    // Forgive an isolated slip: the escalation resets after a quiet spell, so a
    // grown-up who mistaps once is never haunted by it later.
    window.clearTimeout(timers.current.forgive);
    timers.current.forgive = window.setTimeout(() => {
      wrongStreak.current = 0;
    }, pauseMs + 6000);
  };

  if (hasPin) {
    return (
      <main class="child-screen" style={{ background: 'var(--bg0)' }}>
        <form
          class="overlay-card"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await checkPin(pin)) onPassed();
            else {
              setErr('That PIN does not match.');
              setPin('');
            }
          }}
        >
          <h1 tabindex={-1}>Enter your PIN</h1>
          <p class="card-note">The lock you set to keep notes away from casual eyes. It asks again each time you come back from the child screen.</p>
          <label class="field">
            <span class="field-label">PIN</span>
            <input
              type="password"
              inputmode="numeric"
              autocomplete="off"
              value={pin}
              onInput={(e) => setPin((e.target as HTMLInputElement).value)}
            />
          </label>
          {err && <p class="msg-err" role="alert">{err}</p>}
          <button class="btn btn-primary" type="submit">
            Open
          </button>
          <a class="btn gate-exit" href="#/">
            <HomeIcon />
            Back to the child screen
          </a>
          <p class="card-note" style={{ marginTop: '0.8rem' }}>
            Forgotten it? There is no recovery by design. Clearing this site's data in your browser settings
            removes the lock, along with every profile, note, and photo on this device. A saved backup file
            brings the children back afterwards.
          </p>
        </form>
      </main>
    );
  }

  return (
    <main class="child-screen" style={{ background: 'var(--bg0)' }}>
      <div class="hold-wrap">
        <h1 tabindex={-1} style={{ color: 'var(--inkSoft)' }}>
          For grown-ups
        </h1>
        <HoldButton label="Press and hold" onComplete={onPassed} />
        <p class="card-note" style={{ textAlign: 'center', maxWidth: '26rem' }}>
          Or, if holding is difficult, tap the word <b>{target}</b>:
        </p>
        <div class="word-choice" role="group" aria-label={`Tap the word ${target}`}>
          {words.map((word) => (
            <button
              key={word}
              class="btn"
              aria-disabled={wordsLocked}
              onClick={() => {
                // Ignore taps during the cooldown, but keep the choices in the
                // switch-scan set (aria-disabled, not disabled) so a switch or
                // screen-reader caregiver never loses them mid-pause (FR-11).
                if (wordsLocked) return;
                if (word === target) onPassed();
                else onWrongWord();
              }}
            >
              {word}
            </button>
          ))}
        </div>
        {/* Non-visual counterpart to the dimming: tells a screen-reader
            caregiver why a tap did nothing during the cooldown (AR-6). */}
        <p class="sr-only" aria-live="polite">
          {wordsLocked ? 'Just a moment, then try again.' : ''}
        </p>
        <a class="btn gate-exit" href="#/">
          <HomeIcon />
          Back to the child screen
        </a>
      </div>
    </main>
  );
}

/** A simple house glyph on the gate's exit, so the way back to the child screen
 *  reads as "home" even to a child who cannot yet read the label (FR-5). */
function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      stroke-width="2.2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 11.5 12 5l8 6.5" />
      <path d="M6.5 10.5V19h11v-8.5" />
    </svg>
  );
}
