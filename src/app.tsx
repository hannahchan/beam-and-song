import { useEffect, useState } from 'preact/hooks';
import { useRoute } from './lib/router';
import { Landing } from './ui/Landing';
import { Chooser } from './ui/Chooser';
import { Player } from './ui/Player';
import { About } from './ui/About';
import { GATE_KEY, GrownUps } from './ui/grownups/GrownUps';
import { useStore } from './ui/useStore';
import { paceMultiplier } from './engine/params';
import { dwellFromPace, scanner } from './ui/scan';

export function App() {
  const route = useRoute();
  const state = useStore();
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const onReady = () => setUpdateReady(true);
    window.addEventListener('bs-update-ready', onReady);
    return () => window.removeEventListener('bs-update-ready', onReady);
  }, []);

  // AR-2/AR-8, switch scanning follows the active child's settings, with
  // dwell timing derived from their pace/latency setting.
  const active = state.profiles.find((p) => p.id === state.activeProfileId) ?? state.profiles[0];
  const scanning = active?.settings.scanning ?? 'off';
  const pace = active?.settings.pace ?? 2;
  useEffect(() => {
    scanner.configure(scanning, dwellFromPace(paceMultiplier(pace)));
  }, [scanning, pace]);

  // FR-5/PV-3, leaving the grown-up area always re-locks it, so a parent who
  // opens Settings first and then hands the tablet to their child doesn't leave
  // the grown-up area unlocked behind them. With a PIN set the PIN re-prompts on
  // return; without one, the press-and-hold / tap-the-word gate does.
  useEffect(() => {
    if (!route.path.startsWith('/grown-ups')) {
      sessionStorage.removeItem(GATE_KEY);
    }
  }, [route.path]);

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'The Light & Sound App for Kids with CVI',
      '/choose': 'Choose a lesson, Light & Sound',
      '/play': 'Lesson, Light & Sound',
      '/about': 'About, Light & Sound',
    };
    document.title = route.path.startsWith('/grown-ups')
      ? 'For grown-ups, Light & Sound'
      : (titles[route.path] ?? 'Light & Sound');
  }, [route.path]);

  // The refresh nudge never appears over a lesson in progress.
  const toast = updateReady && route.path !== '/play' && (
    <div class="update-toast" role="status">
      <span>A small update is ready.</span>
      <button class="btn btn-small" onClick={() => location.reload()}>
        Refresh
      </button>
      <button class="btn btn-small btn-quiet" onClick={() => setUpdateReady(false)} aria-label="Dismiss update notice">
        Later
      </button>
    </div>
  );

  let page;
  if (route.path === '/choose') page = <Chooser />;
  else if (route.path === '/play')
    page = (
      <Player
        lessonId={route.params.get('lesson') ?? undefined}
        programId={route.params.get('program') ?? undefined}
      />
    );
  else if (route.path === '/about') page = <About />;
  else if (route.path.startsWith('/grown-ups')) page = <GrownUps route={route} />;
  else page = <Landing />;

  return (
    <>
      {page}
      {toast}
    </>
  );
}
