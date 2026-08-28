import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home is semantic, quiet in the console, and accessible', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');

  await expect(page).toHaveTitle(/Meeple Import Doctor/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('img')).toHaveAttribute('alt', /game piece/i);
  expect(errors).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('sample produces field evidence, normalized JSON, and local history', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /open a sample diagnosis/i }).click();

  await expect(page.getByRole('heading', { name: /Importable, with 1 missing field/i })).toBeVisible();
  await expect(page.locator('#report')).toContainText('Built-in sample · no request');
  await expect(page.locator('.field-row')).toHaveCount(5);
  await expect(page.getByText('Lantern Keepers', { exact: true }).first()).toBeVisible();
  await expect(page.locator('pre')).toContainText('"source": "BoardGameGeek"');
  await expect(page.locator('#recent-list')).toContainText('Lantern Keepers');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('invalid source-specific URL gives a useful inline error', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/browse/boardgame');
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.getByRole('alert')).toContainText('BoardGameGeek item URL');
  await expect(page.getByLabel('Item page URL')).toHaveAttribute('aria-invalid', 'true');
});

test('the inspector is operable from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Item page URL').focus();
  await page.keyboard.type('https://boardgamegeek.com/browse/boardgame');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Inspect URL' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('BoardGameGeek item URL');
});

test('pasted HTML is parsed locally with no third-party request', async ({ page }) => {
  const outsideRequests: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) outsideRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://www.discogs.com/release/42-example');
  await page.getByText(/Paste page HTML instead/).click();
  await page.getByLabel(/Page HTML/).fill('<html><head><meta property="og:title" content="Night Signals | Discogs"><meta name="description" content="A record"></head><body><h1>Night Signals</h1><time datetime="1994"></time><a href="/artist/2">The Signals</a></body></html>');
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.locator('#report')).toContainText('Pasted HTML · local only');
  await expect(page.locator('pre')).toContainText('Night Signals');
  expect(outsideRequests).toEqual([]);
});

test('a refused direct request is classified as blocked', async ({ page }) => {
  await page.route('https://boardgamegeek.com/boardgame/7/test', (route) => route.fulfill({
    status: 403,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
    body: '<html><head><title>Access denied</title></head></html>',
  }));
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.getByRole('heading', { name: /source refused this request/i })).toBeVisible();
  await expect(page.locator('#report')).toContainText('403 Forbidden');
});

test('direct requests have a per-source cooldown while pasted HTML remains local', async ({ page }) => {
  let requests = 0;
  await page.route('https://boardgamegeek.com/boardgame/7/test', (route) => {
    requests += 1;
    return route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
      body: '<html><head><title>Test game | BoardGameGeek</title></head><body><h1>Test game</h1></body></html>',
    });
  });
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.locator('#report')).toBeVisible();

  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.getByRole('alert')).toContainText(/wait about .* seconds.*paste page HTML/i);
  expect(requests).toBe(1);

  await page.getByText(/Paste page HTML instead/).click();
  await page.getByLabel(/Page HTML/).fill('<html><head><title>Local game | BoardGameGeek</title></head></html>');
  await page.getByRole('button', { name: 'Inspect URL' }).click();
  await expect(page.locator('#report')).toContainText('Pasted HTML · local only');
  expect(requests).toBe(1);
});

test('a fresh service-worker install can reopen and run a sample offline', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const online = await context.newPage();
    await online.goto('http://127.0.0.1:4173/');
    await online.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    const cachedPaths = await online.evaluate(async () => {
      const cacheNames = await caches.keys();
      const entries = await Promise.all(cacheNames.map(async (name) => (await caches.open(name)).keys()));
      return entries.flat().map((request) => new URL(request.url).pathname);
    });
    // The assertion below proves install-time precaching includes the hashed
    // module and stylesheet, rather than relying on an online reload to fill
    // the runtime cache.
    expect(cachedPaths).toEqual(expect.arrayContaining([expect.stringMatching(/^\/assets\/.*\.js$/), expect.stringMatching(/^\/assets\/.*\.css$/)]));

    await context.setOffline(true);
    const offline = await context.newPage();
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    offline.on('pageerror', (error) => pageErrors.push(error.message));
    offline.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await offline.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
    await offline.getByRole('button', { name: /open a sample diagnosis/i }).click();
    await expect.poll(() => pageErrors, { timeout: 1_000 }).toEqual([]);
    await expect.poll(() => consoleErrors, { timeout: 1_000 }).toEqual([]);
    await expect(offline.getByRole('heading', { name: /Importable, with 1 missing field/i })).toBeVisible();
  } finally {
    await context.close();
  }
});

test('mobile layout has no horizontal overflow and primary targets are large enough', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion');
  await page.goto('/');
  const sizes = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(sizes.body).toBeLessThanOrEqual(sizes.viewport);
  const box = await page.getByRole('button', { name: 'Inspect URL' }).boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
});

test('privacy and terms pages have accessible document structure', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});
