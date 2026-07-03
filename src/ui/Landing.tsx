import { navigate } from '../lib/router';
import { audio } from '../engine/audio';
import { ensureProfile } from '../lib/store';

/**
 * FR-1 — a calm landing with one big door for the child and a small,
 * tucked-away door for grown-ups. The Start tap doubles as the media
 * unlock gesture (TR-6) and the fullscreen request.
 */
export function Landing() {
  const start = () => {
    ensureProfile();
    void audio.unlock();
    // Fire-and-forget: fullscreen is a nicety, and its promise can stall on
    // some browsers — navigation must never wait on it.
    try {
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {});
    } catch {
      /* some browsers decline; fine */
    }
    navigate('/choose');
  };

  return (
    <main class="child-screen">
      <p class="landing-title">beam and song</p>
      <button class="start-orb" onClick={start} aria-label="Start — gentle lessons">
        Start
      </button>
      <p class="landing-footnote">A companion to your child's vision team — gentle light and song, tuned to your child.</p>
      <a class="btn btn-quiet landing-grownups" href="#/grown-ups">
        For grown-ups
      </a>
    </main>
  );
}
