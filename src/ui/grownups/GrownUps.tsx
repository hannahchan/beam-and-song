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
 * When a PIN is set, the PIN *is* the gate (it re-locks every time the app
 * returns to the child screen — see App); without one, the press-and-hold /
 * tap-the-word gate keeps small hands out.
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

  // The print views render without the app shell — clean on paper.
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
          Light & Sound is a companion to your child's vision professional or early-intervention team — not a
          programme, a curriculum, or any kind of assessment. Everything you save stays on this device only.
        </p>
      </footer>
    </div>
  );
}

function Gate({ hasPin, onPassed }: { hasPin: boolean; onPassed: () => void }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  // Stable shuffled order so re-renders don't shuffle under the finger.
  const words = useMemo(() => {
    const w = [
      ['one', false],
      ['two', true],
      ['three', false],
    ] as Array<[string, boolean]>;
    return w.sort(() => (Math.random() < 0.5 ? -1 : 1));
  }, []);

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
          <a class="btn btn-quiet" href="#/">
            Back to the child screen
          </a>
          <p class="card-note" style={{ marginTop: '0.8rem' }}>
            Forgotten it? There is no recovery by design — clearing this site's data in your browser settings
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
          Or, if holding is difficult, tap the word <b>two</b>:
        </p>
        <div class="word-choice" role="group" aria-label="Tap the word two">
          {words.map(([word, correct]) => (
            <button key={word} class="btn" onClick={() => (correct ? onPassed() : undefined)}>
              {word}
            </button>
          ))}
        </div>
        <a class="btn btn-quiet" href="#/">
          Back to the child screen
        </a>
      </div>
    </main>
  );
}
