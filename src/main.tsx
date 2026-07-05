import { render } from 'preact';
import { App } from './app';
import { applyTheme } from './lib/tokens';
import { applyLocale } from './lib/locale';
import './styles.css';

applyTheme(document.documentElement);
applyLocale(document.documentElement);
render(<App />, document.getElementById('app')!);

// Ask the browser to treat this site's storage as persistent, profiles,
// notes, and the family's own media should survive storage pressure and
// idle-eviction policies (PV-2 durability). Best-effort; browsers decide.
try {
  void navigator.storage?.persist?.().catch(() => {});
} catch {
  /* older browsers */
}

// Offline support (TR-4): once loaded, lessons keep working without a connection.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      // A quiet heads-up when a new version is installed, never an
      // automatic reload, which could interrupt a lesson (FR-12 spirit).
      reg.addEventListener('updatefound', () => {
        const fresh = reg.installing;
        fresh?.addEventListener('statechange', () => {
          if (fresh.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('bs-update-ready'));
          }
        });
      });
    } catch {
      /* offline support is an enhancement; the app works without it */
    }
  });
}
