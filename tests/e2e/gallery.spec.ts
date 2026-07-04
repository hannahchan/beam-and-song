import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { LESSONS } from '../../src/lessons/specs';

/**
 * Opt-in lesson gallery — a screenshot flip-book of the whole library for
 * human review (see docs/gallery.md). Deliberately NOT part of the default
 * `npx playwright test` run that gates CI deploys: every test here is
 * skipped unless GALLERY is set.
 *
 *   GALLERY=1 npx playwright test tests/e2e/gallery.spec.ts
 *   GALLERY=1 BAND=teen npx playwright test tests/e2e/gallery.spec.ts
 *
 * Output: test-results/gallery/<band>/<NN>-<lesson-id>.png (library order).
 */

const GALLERY = !!process.env.GALLERY && process.env.GALLERY !== '0';

const BANDS = ['infant', 'child', 'teen'] as const;
type Band = (typeof BANDS)[number];
const band = (process.env.BAND ?? 'infant') as Band;
if (!BANDS.includes(band)) {
  throw new Error(`BAND must be one of ${BANDS.join(', ')} — got "${process.env.BAND}"`);
}

/** Long enough for every scene to develop past its entry fade-in (SR-2). */
const SETTLE_MS = 4_500;

const OUT_DIR = fileURLToPath(new URL(`../../test-results/gallery/${band}/`, import.meta.url));

// Captures are independent — let them spread across workers.
test.describe.configure({ mode: 'parallel' });

test.describe('lesson gallery (screenshot flip-book)', () => {
  test.skip(!GALLERY, 'Opt-in: GALLERY=1 npx playwright test tests/e2e/gallery.spec.ts');

  test.beforeEach(async ({ page }) => {
    // Seed a throwaway profile before the app boots. store.ts normalizes it
    // on load (migrate → normalizeProfile), merging settings over
    // DEFAULT_SETTINGS. The one generated photo matters: without an enabled
    // photo the Player silently swaps requiresPhoto lessons for Gentle Glow.
    await page.addInitScript(
      ({ ageBand }) => {
        // A tiny visible swatch standing in for a family photo, plus its true
        // average luminance (same formula as src/lib/photos.ts) so the
        // safety model treats it exactly like a real import.
        const c = document.createElement('canvas');
        c.width = 64;
        c.height = 64;
        const g = c.getContext('2d');
        if (!g) throw new Error('gallery seed: no 2d context');
        g.fillStyle = '#e8a87c';
        g.fillRect(0, 0, 64, 64);
        g.fillStyle = '#7c5236';
        g.beginPath();
        g.arc(32, 32, 18, 0, Math.PI * 2);
        g.fill();
        const data = g.getImageData(0, 0, 64, 64).data;
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        };
        let lum = 0;
        for (let i = 0; i < data.length; i += 4) {
          lum += 0.2126 * lin(data[i]) + 0.7152 * lin(data[i + 1]) + 0.0722 * lin(data[i + 2]);
        }
        lum /= data.length / 4;

        const now = new Date().toISOString();
        localStorage.setItem(
          'beam-and-song:v1',
          JSON.stringify({
            version: 1,
            activeProfileId: 'gallery-child',
            pinHash: null,
            lastBackupAt: null,
            profiles: [
              {
                id: 'gallery-child',
                nickname: 'Gallery',
                createdAt: now,
                lastReviewAt: now,
                ageBand,
                settings: {},
                favorites: [],
                programs: [],
                photos: [
                  {
                    id: 'gallery-photo',
                    label: 'the little sun',
                    dataUrl: c.toDataURL('image/png'),
                    lum,
                    addedAt: now,
                  },
                ],
                audio: [],
                sessions: [],
              },
            ],
          }),
        );
      },
      { ageBand: band },
    );
  });

  for (const [i, lesson] of LESSONS.entries()) {
    const name = `${String(i + 1).padStart(2, '0')}-${lesson.id}`;
    test(name, async ({ page }) => {
      await page.goto(`/#/play?lesson=${lesson.id}`);
      await expect(page.locator('.player canvas')).toBeVisible();
      await page.waitForTimeout(SETTLE_MS);
      await page.screenshot({ path: join(OUT_DIR, `${name}.png`) });
    });
  }
});
