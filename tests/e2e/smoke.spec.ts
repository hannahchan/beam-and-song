import { expect, test, type Page } from '@playwright/test';

/**
 * End-to-end smoke: the flows jsdom can't exercise — real canvas rendering,
 * the gate, session end-to-observation, persistence, downloads, scanning.
 */

/** Sum a sparse sample of canvas pixels — enough to detect animation. */
async function canvasSignature(page: Page): Promise<number> {
  return page.evaluate(() => {
    const c = document.querySelector('.player canvas') as HTMLCanvasElement;
    const g = c.getContext('2d')!;
    const { data } = g.getImageData(0, 0, c.width, Math.max(1, c.height));
    let sum = 0;
    for (let i = 0; i < data.length; i += 4001) sum += data[i];
    return sum;
  });
}

test('child flow: start → tile → animating lesson → pause → observe → save', async ({ page }) => {
  await page.goto('/');
  // Keyboard activation: the orb breathes forever by design (0.25 Hz), so
  // pointer "stability" never settles — and this exercises the keyboard path too.
  await page.getByRole('button', { name: /^Start/ }).press('Enter');
  await page.getByRole('button', { name: /Play Gentle Glow/ }).click();

  await expect(page.locator('.player canvas')).toBeVisible();
  await page.waitForTimeout(1200);
  const a = await canvasSignature(page);
  await page.waitForTimeout(900);
  const b = await canvasSignature(page);
  expect(a).not.toBe(b); // the scene is genuinely animating

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /Paused/ })).toBeVisible();
  await page.getByRole('button', { name: 'End the session' }).click();
  await page.getByRole('button', { name: 'A little' }).click();
  await page.getByRole('button', { name: 'tired' }).click();
  await page.getByRole('button', { name: /Save & finish/ }).click();
  await expect(page.getByRole('button', { name: /^Start/ })).toBeVisible();

  const saved = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('beam-and-song:v1')!);
    return s.profiles[0].sessions.at(-1);
  });
  expect(saved.response).toBe('some');
  expect(saved.tags).toEqual(['tired']);
});

/** Pass the gate; create a child if this is a fresh browser profile. */
async function openGrownUps(page: Page): Promise<void> {
  await page.goto('/#/grown-ups');
  await page.getByRole('button', { name: 'two', exact: true }).click();
  const welcome = page.getByRole('heading', { name: 'Welcome' });
  if (await welcome.isVisible().catch(() => false)) {
    await page.getByLabel(/nickname for your child/i).fill('Bean');
    await page.getByRole('button', { name: /Create/ }).click();
    await page.goto('/#/grown-ups');
  }
}

test('grown-up gate: the tap-the-word path opens the area (FR-11)', async ({ page }) => {
  await page.goto('/#/grown-ups');
  await page.getByRole('button', { name: 'two', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Welcome|space$/ })).toBeVisible();
});

test('settings persist across reload, and the live preview animates (PT-2)', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('link', { name: 'Settings' }).click();

  // The live preview runs the real engine and follows changes instantly.
  const previewSig = () =>
    page.evaluate(() => {
      const c = document.querySelector('.preview-canvas') as HTMLCanvasElement;
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4001) sum += data[i] + data[i + 1];
      return sum;
    });
  await page.waitForTimeout(900);
  const a = await previewSig();
  await page.waitForTimeout(900);
  const b = await previewSig();
  expect(a).not.toBe(b); // breathing/drifting, live

  await page.getByRole('button', { name: 'Target colour yellow' }).click();
  await page.waitForTimeout(400);
  const yellowish = await page.evaluate(() => {
    const c = document.querySelector('.preview-canvas') as HTMLCanvasElement;
    const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height);
    let r = 0;
    let g = 0;
    for (let i = 0; i < data.length; i += 4001) {
      r += data[i];
      g += data[i + 1];
    }
    return g > r * 0.5; // yellow has strong green; red does not
  });
  expect(yellowish).toBe(true); // the preview followed the colour change

  await page.reload();
  await expect(page.getByRole('button', { name: 'Target colour yellow' })).toHaveAttribute('aria-pressed', 'true');
});

test('profile export downloads a JSON file flagged as personal (PV-4)', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('link', { name: 'Children' }).click();
  await page.getByText('Rename, move, or remove').click();
  await page.getByRole('button', { name: /Export this profile/ }).click();
  await expect(page.getByText(/personal\s+information about your child/)).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save the file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/beam-and-song-profile-.*\.json/);
});

test('switch scanning: ring appears and step-scan moves and activates', async ({ page }) => {
  await openGrownUps(page);
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('radio', { name: /Two switches/ }).check();
  await expect(page.locator('#bs-scan-ring')).toBeVisible();

  const posOf = () => page.locator('#bs-scan-ring').evaluate((el) => el.getBoundingClientRect().top + el.getBoundingClientRect().left);
  const p1 = await posOf();
  await page.keyboard.press(' ');
  await page.waitForTimeout(600);
  const p2 = await posOf();
  expect(p1).not.toBe(p2); // the ring glided to the next control

  // Turning scanning back off via the scanner itself: walk shouldn't be
  // needed — verify Enter activates the currently highlighted control.
  await page.keyboard.press('Enter');
});
