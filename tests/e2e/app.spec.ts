import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home is semantic, quiet in the console, and accessible', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');

  await expect(page).toHaveTitle('Meeple Import Doctor — fix failed imports');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('img')).toHaveAttribute('alt', /game piece/i);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://boardgame-catalog-import-debugger.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.webp$/);
  await expect(page.getByRole('heading', { name: 'Fix a failed board-game catalog import' })).toBeVisible();
  expect(errors).toEqual([]);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('@claim:demo-isolation demo storage never changes ordinary history', async ({ page }) => {
  const realHistory = JSON.stringify([{ url: 'https://example.test/real', source: 'Real', diagnosis: 'healthy', title: 'Real history', at: '2026-08-01T00:00:00.000Z' }]);
  await page.addInitScript((stored) => localStorage.setItem('meeple-doctor:recent:v1', stored), realHistory);
  await page.goto('/demo');
  await expect(page.getByLabel('Demo mode')).toContainText('sample data, nothing is saved to your real history');
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo' }).click();
  expect(await page.evaluate(() => localStorage.getItem('meeple-doctor:recent:v1'))).toBe(realHistory);
  expect(await page.evaluate(() => localStorage.getItem('demo:meeple-doctor:recent:v1'))).toContain('Lantern Keepers');
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL('/');
  expect(await page.evaluate(() => localStorage.getItem('meeple-doctor:recent:v1'))).toBe(realHistory);
  expect(await page.evaluate(() => localStorage.getItem('demo:meeple-doctor:recent:v1'))).toBeNull();
});

test('@claim:demo-no-third-party-requests demo makes no third-party requests', async ({ page }) => {
  const outsideRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outsideRequests.push(request.url());
  });
  await page.goto('/demo');
  await expect(page.locator('#report')).toBeVisible();
  expect(outsideRequests).toEqual([]);
});

test('@claim:sample-report-json sample produces field evidence and copied manual JSON', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/demo');

  await expect(page.getByRole('heading', { name: /Importable, with 1 missing field/i })).toBeVisible();
  await expect(page.locator('#report')).toContainText('Built-in sample · no request');
  await expect(page.locator('.field-row')).toHaveCount(5);
  await expect(page.getByText('Lantern Keepers', { exact: true }).first()).toBeVisible();
  await expect(page.locator('pre')).toContainText('"source": "BoardGameGeek"');
  await page.getByRole('button', { name: 'Copy JSON' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('"source": "BoardGameGeek"');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('invalid source-specific URL gives a useful inline error', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/browse/boardgame');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.getByRole('alert')).toContainText('BoardGameGeek item URL');
  await expect(page.getByLabel('Item page URL')).toHaveAttribute('aria-invalid', 'true');
});

test('the inspector is operable from the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to inspector' })).toBeFocused();
  await expect(page.getByRole('link', { name: 'Skip to inspector' })).toHaveCSS('outline-width', '3px');
  await page.getByLabel('Item page URL').focus();
  await page.keyboard.type('https://boardgamegeek.com/browse/boardgame');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Inspect my URL' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alert')).toContainText('BoardGameGeek item URL');
});

test('@claim:pasted-html-local pasted HTML is parsed locally with no third-party request', async ({ page }) => {
  const outsideRequests: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4173')) outsideRequests.push(request.url());
  });
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://www.discogs.com/release/42-example');
  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  await page.getByLabel(/Page HTML/).fill('<html><head><meta property="og:title" content="Night Signals | Discogs"><meta name="description" content="A record"></head><body><h1>Night Signals</h1><time datetime="1994"></time><a href="/artist/2">The Signals</a><img src="https://tracking.invalid/pixel"><script>window.__pastedScriptRan = true</script></body></html>');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toContainText('Pasted HTML · local only');
  await expect(page.locator('pre')).toContainText('Night Signals');
  expect(await page.evaluate(() => '__pastedScriptRan' in window)).toBe(false);
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
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.getByRole('heading', { name: /source refused this request/i })).toBeVisible();
  await expect(page.locator('#report')).toContainText('403 Forbidden');
});

test('@claim:request-cooldown @claim:direct-request-privacy direct requests have a per-source 15-second cooldown while pasted HTML remains local', async ({ page }) => {
  let requests = 0;
  let sourceCookie: string | undefined;
  await page.context().addCookies([{ name: 'private-source-session', value: 'secret', domain: 'boardgamegeek.com', path: '/' }]);
  await page.route('https://boardgamegeek.com/boardgame/7/test', (route) => {
    requests += 1;
    sourceCookie = route.request().headers().cookie;
    return route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
      body: '<html><head><title>Test game | BoardGameGeek</title></head><body><h1>Test game</h1></body></html>',
    });
  });
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toBeVisible();

  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.getByRole('alert')).toContainText(/wait about .* seconds.*paste page HTML/i);
  expect(requests).toBe(1);
  expect(sourceCookie).toBeUndefined();

  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  await page.getByLabel(/Page HTML/).fill('<html><head><title>Local game | BoardGameGeek</title></head></html>');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toContainText('Pasted HTML · local only');
  expect(requests).toBe(1);
});

test('@claim:offline-reload a fresh service-worker install can reopen the demo offline', async ({ browser }) => {
  const context = await browser.newContext();
  try {
    const online = await context.newPage();
    await online.goto('http://127.0.0.1:4173/');
    await online.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
    const cachedAssets = await online.evaluate(async () => {
      const cacheNames = await caches.keys();
      const entries = await Promise.all(cacheNames.map(async (name) => (await caches.open(name)).keys()));
      return Promise.all(entries.flat().map(async (request) => {
        const response = await caches.match(request);
        return { path: new URL(request.url).pathname, bytes: (await response!.arrayBuffer()).byteLength };
      }));
    });
    // The assertion below proves install-time precaching includes the hashed
    // module and stylesheet with actual response bodies, rather than relying
    // on an online reload or a racy conditional request to fill the cache.
    expect(cachedAssets).toEqual(expect.arrayContaining([
      expect.objectContaining({ path: expect.stringMatching(/^\/assets\/.*\.js$/), bytes: expect.any(Number) }),
      expect.objectContaining({ path: expect.stringMatching(/^\/assets\/.*\.css$/), bytes: expect.any(Number) }),
    ]));
    expect(cachedAssets.filter(({ path }) => /\/assets\/.*\.(?:js|css)$/.test(path)).every(({ bytes }) => bytes > 0)).toBe(true);

    await context.setOffline(true);
    const offline = await context.newPage();
    const pageErrors: string[] = [];
    const failedAppAssets: string[] = [];
    offline.on('pageerror', (error) => pageErrors.push(error.message));
    offline.on('requestfailed', (request) => {
      if (/\/assets\/.*\.(?:js|css)$/.test(new URL(request.url()).pathname)) failedAppAssets.push(request.url());
    });
    await offline.goto('http://127.0.0.1:4173/demo', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => pageErrors, { timeout: 1_000 }).toEqual([]);
    expect(failedAppAssets).toEqual([]);
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
  const box = await page.getByRole('button', { name: 'Inspect my URL' }).boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
});

test('privacy and terms pages have accessible document structure', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('footer')).toContainText('Built by Param Factory');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test('@claim:recent-five only five ordinary recent URLs are stored', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  for (let number = 1; number <= 6; number += 1) {
    await page.getByLabel('Item page URL').fill(`https://example${number}.test/item`);
    await page.getByLabel(/Page HTML/).fill(`<html><head><title>Item ${number}</title></head><body><h1>Item ${number}</h1></body></html>`);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toBeVisible();
  }
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('meeple-doctor:recent:v1') ?? '[]')) as Array<{ title: string }>;
  expect(stored).toHaveLength(5);
  expect(stored.map((item) => item.title)).not.toContain('Item 1');
  await expect(page.locator('#recent-list li')).toHaveCount(5);
});

test('@claim:no-account-or-payment sample and landing have no account or payment control', async ({ page }) => {
  for (const path of ['/', '/demo']) {
    await page.goto(path);
    await expect(page.locator('input[type="password"], input[type="email"], [name*="password" i], [name*="login" i], [href*="checkout" i], [href*="payment" i]')).toHaveCount(0);
  }
});

test('@claim:source-maps tailored and generic page checks identify their source', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  const fixtures = [
    ['https://boardgamegeek.com/boardgame/7/test', 'BoardGameGeek', '<html><head><title>Test game | BoardGameGeek</title></head><body><h1>Test game</h1></body></html>'],
    ['https://discogs.com/release/42-test', 'Discogs', '<html><head><title>Test record | Discogs</title></head><body><h1>Test record</h1></body></html>'],
    ['https://catalog.example/item', 'Generic web page', '<html><head><meta property="og:title" content="Test item"></head><body><h1>Test item</h1></body></html>'],
  ] as const;
  for (const [url, source, html] of fixtures) {
    await page.getByLabel('Item page URL').fill(url);
    await page.getByLabel(/Page HTML/).fill(html);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toContainText(`Source: ${source}`);
  }
});

test('demo has its own title and the designed 404 page leads home', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Meeple Import Doctor');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://boardgame-catalog-import-debugger.sociobot.in/demo');
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Page not found — Meeple Import Doctor');
  await expect(page.getByRole('heading', { name: 'This address was not found.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Return to the import checker' })).toHaveAttribute('href', '/');
});
