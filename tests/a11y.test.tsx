// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest';
import { render } from 'preact';
import axe from 'axe-core';

/**
 * TR-10 / AR-6 — automated WCAG checks on every grown-up page with real
 * seeded data. (Contrast is covered separately in tokens.test.ts; jsdom
 * cannot compute it.) Manual keyboard/switch walkthroughs are still part of
 * the release checklist — see docs/requirements-coverage.md.
 */

beforeAll(async () => {
  document.documentElement.lang = 'en';
  document.title = 'Beam and Song test';
  sessionStorage.setItem('beam-and-song:grownup-ok', '1');

  const store = await import('../src/lib/store');
  const p = store.createProfile('Bean');
  store.toggleFavorite(p.id, 'little-star');
  store.addSession(p.id, {
    at: new Date().toISOString(),
    lessonId: 'gentle-glow',
    durationSec: 200,
    response: 'some',
    tags: ['tired'],
    note: 'Went quiet and watched.',
  });
  store.updateProfile(p.id, (prof) => {
    prof.photos.push({
      id: 'ph1',
      label: 'ducky',
      // 1x1 px jpeg-ish placeholder; only rendered as an <img> src.
      dataUrl:
        'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      addedAt: new Date().toISOString(),
    });
  });
});

async function checkRoute(path: string): Promise<void> {
  location.hash = `#${path}`;
  const host = document.createElement('div');
  document.body.innerHTML = '';
  document.body.appendChild(host);
  const { App } = await import('../src/app');
  render(<App />, host);
  await new Promise((r) => setTimeout(r, 30));

  const results = await axe.run(host, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    rules: { 'color-contrast': { enabled: false } },
  });
  const readable = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html).join(' | ')}`);
  expect(readable).toEqual([]);
  render(null, host);
}

describe('grown-up pages have no WCAG A/AA violations (axe)', () => {
  it('dashboard', () => checkRoute('/grown-ups'));
  it('library', () => checkRoute('/grown-ups/library'));
  it('settings', () => checkRoute('/grown-ups/settings'));
  it('sessions', () => checkRoute('/grown-ups/sessions'));
  it('guide', () => checkRoute('/grown-ups/guide'));
  it('profiles', () => checkRoute('/grown-ups/profiles'));
  it('guided setup', () => checkRoute('/grown-ups/setup'));
  it('printable summary', () => checkRoute('/grown-ups/print'));
  it('lesson walk-through', () => checkRoute('/grown-ups/review'));
});

describe('child-facing pages are semantically sound too', () => {
  it('landing', () => checkRoute('/'));
});
