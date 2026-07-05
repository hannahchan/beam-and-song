import { navigate } from '../lib/router';
import { audio } from '../engine/audio';
import { ensureProfile, getState } from '../lib/store';

/**
 * FR-1, a calm landing with one big door for the child and a small,
 * tucked-away door for grown-ups. The Start tap doubles as the media
 * unlock gesture (TR-6) and the fullscreen request.
 */
export function Landing() {
  const start = () => {
    ensureProfile();
    void audio.unlock();
    // Fire-and-forget: fullscreen is a nicety, and its promise can stall on
    // some browsers, navigation must never wait on it.
    try {
      document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })?.catch(() => {});
    } catch {
      /* some browsers decline; fine */
    }
    navigate('/choose');
  };

  // With several children on one device, say quietly who is up, so a
  // grown-up never has to enter their area just to check (PT-1).
  const profiles = getState().profiles;
  const active = profiles.find((p) => p.id === getState().activeProfileId) ?? profiles[0];

  return (
    <main class="child-screen landing-screen">
      <p class="landing-title">light & sound</p>
      <div class="landing-orb-wrap">
        <button class="start-orb" onClick={start} aria-label="Start, gentle lessons">
          Start
        </button>
      </div>
      <div class="landing-footer">
        <p class="landing-footnote">A companion to your child's vision team, gentle light and song, tuned to your child.</p>
        <div class="landing-footer-row">
          {profiles.length > 1 && active && <p class="landing-profile">ready for {active.nickname}</p>}
          <a class="btn btn-quiet landing-grownups" href="#/grown-ups">
            For grown-ups
          </a>
        </div>
      </div>
    </main>
  );
}
