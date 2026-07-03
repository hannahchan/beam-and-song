import { render } from 'preact';
import { App } from './app';
import { applyTheme } from './lib/tokens';
import './styles.css';

applyTheme(document.documentElement);
render(<App />, document.getElementById('app')!);

// Offline support (TR-4): once loaded, lessons keep working without a connection.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is an enhancement; the app works without it */
    });
  });
}
