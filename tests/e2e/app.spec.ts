import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';

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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview-[a-f0-9]{12}\.webp$/);
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

test('@claim:request-cooldown direct requests have a per-source 15-second cooldown while pasted HTML remains local', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toBeVisible();

  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.getByRole('alert')).toContainText(/wait about .* seconds.*paste page HTML/i);
  expect(requests).toBe(1);

  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  await page.getByLabel(/Page HTML/).fill('<html><head><title>Local game | BoardGameGeek</title></head></html>');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toContainText('Pasted HTML · local only');
  expect(requests).toBe(1);
});

test('@claim:direct-request-privacy direct source requests omit source-site cookies', async ({ page, context }) => {
  let sourceCookie: string | undefined;
  await context.addCookies([{ name: 'private-source-session', value: 'secret', domain: 'boardgamegeek.com', path: '/' }]);
  await page.route('https://boardgamegeek.com/boardgame/7/test', (route) => {
    sourceCookie = route.request().headers().cookie;
    return route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
      body: '<html><head><title>Cookie check | BoardGameGeek</title></head><body><h1>Cookie check</h1></body></html>',
    });
  });
  await page.goto('/');
  await page.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#report')).toBeVisible();
  expect(sourceCookie).toBeUndefined();
});

test('@claim:cooldown-lifetime a direct-request cooldown disappears when its page closes', async ({ browser }) => {
  const context = await browser.newContext();
  let sourceRequests = 0;
  try {
    await context.route('https://boardgamegeek.com/boardgame/7/test', (route) => {
      sourceRequests += 1;
      return route.fulfill({
        status: 200,
        headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
        body: '<html><head><title>Session check | BoardGameGeek</title></head><body><h1>Session check</h1></body></html>',
      });
    });
    const first = await context.newPage();
    await first.goto('http://127.0.0.1:4173/');
    await first.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
    await first.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(first.locator('#report')).toBeVisible();
    await first.close();

    const second = await context.newPage();
    await second.goto('http://127.0.0.1:4173/');
    await second.getByLabel('Item page URL').fill('https://boardgamegeek.com/boardgame/7/test');
    await second.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(second.locator('#report')).toBeVisible();
    expect(sourceRequests).toBe(2);
  } finally {
    await context.close();
  }
});

test('@claim:pasted-html-memory pasted HTML leaves no raw content after the page closes', async ({ browser }) => {
  const context = await browser.newContext();
  const marker = 'PASTED_HTML_MEMORY_MARKER_7d3a';
  try {
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('Item page URL').fill('https://catalog.example/memory-check');
    await page.getByText(/Paste page HTML if the browser cannot read it/).click();
    await page.getByLabel(/Page HTML/).fill(`<html><head><title>Memory check</title></head><body><!-- ${marker} --><h1>Memory check</h1></body></html>`);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toContainText('Pasted HTML · local only');

    const beforeClose = await page.evaluate(async (rawMarker) => {
      const cacheEntries = await Promise.all((await caches.keys()).map(async (name) => {
        const cache = await caches.open(name);
        return Promise.all((await cache.keys()).map(async (request) => {
          const response = await cache.match(request);
          return { url: request.url, containsMarker: (await response?.text() ?? '').includes(rawMarker) };
        }));
      }));
      const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
      return {
        localValues: Object.values(localStorage),
        sessionValues: Object.values(sessionStorage),
        cacheEntries: cacheEntries.flat(),
        databaseNames: databases.map((database) => database.name).filter(Boolean),
      };
    }, marker);
    expect(beforeClose.localValues.join('\n')).not.toContain(marker);
    expect(beforeClose.sessionValues.join('\n')).not.toContain(marker);
    expect(beforeClose.cacheEntries.some((entry) => entry.containsMarker)).toBe(false);
    expect(beforeClose.databaseNames).toEqual([]);

    await page.close();
    const reopened = await context.newPage();
    await reopened.goto('http://127.0.0.1:4173/');
    await expect(reopened.locator('#page-html')).toHaveValue('');
    const afterClose = await reopened.evaluate(async (rawMarker) => {
      const cacheEntries = await Promise.all((await caches.keys()).map(async (name) => {
        const cache = await caches.open(name);
        return Promise.all((await cache.keys()).map(async (request) => {
          const response = await cache.match(request);
          return { url: request.url, containsMarker: (await response?.text() ?? '').includes(rawMarker) };
        }));
      }));
      return { localValues: Object.values(localStorage), cacheEntries: cacheEntries.flat() };
    }, marker);
    expect(afterClose.localValues.join('\n')).not.toContain(marker);
    expect(afterClose.cacheEntries.some((entry) => entry.containsMarker)).toBe(false);
  } finally {
    await context.close();
  }
});

test('@claim:clear-restore-window recent checks restore immediately and expire after seven seconds', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Paste page HTML if the browser cannot read it/).click();
  await page.getByLabel('Item page URL').fill('https://catalog.example/restore-window');
  await page.getByLabel(/Page HTML/).fill('<html><head><title>Restore window</title></head><body><h1>Restore window</h1></body></html>');
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.locator('#recent-list li')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear history' }).click();
  const restore = page.getByRole('button', { name: 'Restore recent checks' });
  await expect(restore).toBeVisible();
  await restore.click();
  await expect(page.locator('#recent-list li')).toHaveCount(1);

  await page.getByRole('button', { name: 'Clear history' }).click();
  const clearedAt = Date.now();
  await expect(restore).toBeVisible();
  await page.waitForTimeout(7_100);
  expect(Date.now() - clearedAt).toBeGreaterThanOrEqual(7_000);
  await expect(restore).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('meeple-doctor:recent:v1'))).toBe('[]');
});

test('@claim:no-product-tracking the demo sends only page assets and leaves no product cookie or identifier', async ({ browser }) => {
  const context = await browser.newContext();
  const requests: Array<{ url: string; method: string }> = [];
  try {
    const page = await context.newPage();
    page.on('request', (request) => requests.push({ url: request.url(), method: request.method() }));
    await page.goto('http://127.0.0.1:4173/demo');
    await expect(page.locator('#report')).toBeVisible();
    await page.waitForTimeout(100);

    const appOrigin = 'http://127.0.0.1:4173';
    expect(requests.every(({ url, method }) => {
      const requestUrl = new URL(url);
      const isShellPath = ['/', '/demo', '/sw.js', '/favicon.svg', '/apple-touch-icon.png'].includes(requestUrl.pathname)
        || requestUrl.pathname.startsWith('/assets/')
        || requestUrl.pathname.startsWith('/art/');
      return requestUrl.origin === appOrigin && method === 'GET' && isShellPath;
    })).toBe(true);

    const browserState = await page.evaluate(async () => {
      const databases = typeof indexedDB.databases === 'function' ? await indexedDB.databases() : [];
      return {
        cookies: document.cookie,
        localKeys: Object.keys(localStorage),
        sessionKeys: Object.keys(sessionStorage),
        databaseNames: databases.map((database) => database.name).filter(Boolean),
      };
    });
    expect(browserState.cookies).toBe('');
    expect(await context.cookies(appOrigin)).toEqual([]);
    expect(browserState.localKeys).toEqual(['demo:meeple-doctor:recent:v1']);
    expect(browserState.sessionKeys).toEqual([]);
    expect(browserState.databaseNames).toEqual([]);
  } finally {
    await context.close();
  }
});

test('@claim:direct-source-no-proxy a direct check goes only to the source and keeps its raw page out of product storage', async ({ browser }) => {
  const context = await browser.newContext();
  const sourceUrl = 'https://boardgamegeek.com/boardgame/7/test';
  const marker = 'DIRECT_SOURCE_PAGE_MARKER_48f1';
  const outsideRequests: string[] = [];
  try {
    const page = await context.newPage();
    page.on('request', (request) => {
      if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outsideRequests.push(request.url());
    });
    await context.route(sourceUrl, (route) => route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
      body: `<html><head><title>Direct source check | BoardGameGeek</title></head><body><!-- ${marker} --><h1>Direct source check</h1></body></html>`,
    }));
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('Item page URL').fill(sourceUrl);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toContainText('Direct browser request');
    expect(outsideRequests).toEqual([sourceUrl]);

    const persisted = await page.evaluate(async (rawMarker) => {
      const cacheEntries = await Promise.all((await caches.keys()).map(async (name) => {
        const cache = await caches.open(name);
        return Promise.all((await cache.keys()).map(async (request) => {
          const response = await cache.match(request);
          return (await response?.text() ?? '').includes(rawMarker);
        }));
      }));
      return { localValues: Object.values(localStorage), cacheHasMarker: cacheEntries.flat().some(Boolean) };
    }, marker);
    expect(persisted.localValues.join('\n')).not.toContain(marker);
    expect(persisted.cacheHasMarker).toBe(false);
  } finally {
    await context.close();
  }
});

test('@claim:cache-exclusions the offline cache excludes direct source pages and pasted HTML', async ({ browser }) => {
  const context = await browser.newContext();
  const sourceUrl = 'https://boardgamegeek.com/boardgame/7/cache-check';
  const sourceMarker = 'DIRECT_CACHE_MARKER_7c12';
  const pastedMarker = 'PASTED_CACHE_MARKER_7c12';
  try {
    const page = await context.newPage();
    await context.route(sourceUrl, (route) => route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
      body: `<html><head><title>Cache check | BoardGameGeek</title></head><body><!-- ${sourceMarker} --><h1>Cache check</h1></body></html>`,
    }));
    await page.goto('http://127.0.0.1:4173/');
    await page.getByLabel('Item page URL').fill(sourceUrl);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toContainText('Direct browser request');
    await page.getByText(/Paste page HTML if the browser cannot read it/).click();
    await page.getByLabel(/Page HTML/).fill(`<html><head><title>Local cache check</title></head><body><!-- ${pastedMarker} --><h1>Local cache check</h1></body></html>`);
    await page.getByRole('button', { name: 'Inspect my URL' }).click();
    await expect(page.locator('#report')).toContainText('Pasted HTML · local only');

    const cacheEntries = await page.evaluate(async () => {
      const names = await caches.keys();
      return Promise.all(names.map(async (name) => {
        const cache = await caches.open(name);
        return Promise.all((await cache.keys()).map(async (request) => {
          const response = await cache.match(request);
          return { url: request.url, body: await response?.text() ?? '' };
        }));
      }));
    });
    const entries = cacheEntries.flat();
    expect(entries.every((entry) => new URL(entry.url).origin === 'http://127.0.0.1:4173')).toBe(true);
    expect(entries.some((entry) => entry.url === sourceUrl)).toBe(false);
    expect(entries.some((entry) => entry.body.includes(sourceMarker) || entry.body.includes(pastedMarker))).toBe(false);
  } finally {
    await context.close();
  }
});

test('@claim:access-and-bulk-boundaries a refused item page has one direct request and no bypass or batch path', async ({ page }) => {
  const sourceUrl = 'https://boardgamegeek.com/boardgame/7/test';
  const outsideRequests: string[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== 'http://127.0.0.1:4173') outsideRequests.push(request.url());
  });
  await page.route(sourceUrl, (route) => route.fulfill({
    status: 403,
    headers: { 'access-control-allow-origin': '*', 'content-type': 'text/html' },
    body: '<html><head><title>Access denied</title></head><body><h1>Access denied</h1></body></html>',
  }));
  await page.goto('/');
  await expect(page.locator('input[type="url"]')).toHaveCount(1);
  await expect(page.locator('input[multiple], select[multiple]')).toHaveCount(0);
  await page.getByLabel('Item page URL').fill(sourceUrl);
  await page.getByRole('button', { name: 'Inspect my URL' }).click();
  await expect(page.getByRole('heading', { name: /source refused this request/i })).toBeVisible();
  await expect(page.locator('#report')).toContainText('does not bypass access controls');
  await expect(page.locator('pre')).toContainText('"source": "BoardGameGeek"');
  expect(outsideRequests).toEqual([sourceUrl]);
  expect(outsideRequests.some((url) => new URL(url).pathname === '/robots.txt')).toBe(false);
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

test('mobile layout keeps the job, audience, sample action, and facts in the first viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion');
  await page.goto('/');
  const sizes = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(sizes.body).toBeLessThanOrEqual(sizes.viewport);
  await expect(page.getByRole('heading', { name: 'Fix a failed board-game catalog import' })).toBeInViewport();
  await expect(page.getByText('For collectors whose self-hosted catalog cannot read a public item page.')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Try it with sample data' })).toBeInViewport();
  await expect(page.getByText('Opens a BoardGameGeek report with one missing field.')).toBeInViewport();
  for (const fact of await page.locator('.hero-facts li').all()) await expect(fact).toBeInViewport();
  const sampleBox = await page.getByRole('button', { name: 'Try it with sample data' }).boundingBox();
  expect(sampleBox?.height).toBeGreaterThanOrEqual(44);
  expect(sampleBox?.width).toBeGreaterThanOrEqual(44);
  const inspectBox = await page.getByRole('button', { name: 'Inspect my URL' }).boundingBox();
  expect(inspectBox?.height).toBeGreaterThanOrEqual(44);
  expect(inspectBox?.width).toBeGreaterThanOrEqual(44);
});

test('mobile layout keeps the demo label and controls visible throughout the report', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion');
  await page.goto('/demo');
  await expect(page.locator('#report')).toBeVisible();
  await page.locator('pre').scrollIntoViewIfNeeded();
  const banner = page.getByLabel('Demo mode');
  await expect(banner).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Reset demo' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Start for real' })).toBeInViewport();
  const position = await banner.boundingBox();
  expect(position?.y).toBeGreaterThanOrEqual(0);
  expect((position?.y ?? 0) + (position?.height ?? 0)).toBeLessThanOrEqual(844);
});

test('legal navigation focuses and announces each page heading', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Privacy' }).first().click();
  await expect(page).toHaveTitle('Privacy — Meeple Import Doctor');
  await expect(page.getByRole('heading', { name: 'How your inspection data is handled' })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('How your inspection data is handled loaded.');

  await page.getByRole('link', { name: 'Terms' }).first().click();
  await expect(page).toHaveTitle('Terms — Meeple Import Doctor');
  await expect(page.getByRole('heading', { name: 'Terms for checking item pages' })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('Terms for checking item pages loaded.');

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
  expect(Object.keys(stored[0]).sort()).toEqual(['at', 'diagnosis', 'source', 'title', 'url']);
  await expect(page.locator('#recent-list li')).toHaveCount(5);
  await page.goto('/privacy/');
  await expect(page.getByText('Each check stores the URL, source name, diagnosis, extracted title, and inspection time.')).toBeVisible();
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

test('demo has its own title and canonical URL', async ({ page }) => {
  await page.goto('/demo');
  await expect(page).toHaveTitle('Demo — Meeple Import Doctor');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://boardgame-catalog-import-debugger.sociobot.in/demo');
});

test('@claim:designed-404 unknown routes return a focused designed HTTP 404 page', async ({ page }) => {
  const response = await page.goto('/does-not-exist-repair-3');
  expect(response?.status()).toBe(404);
  await expect(page).toHaveTitle('Page not found — Meeple Import Doctor');
  await expect(page.getByRole('heading', { name: 'This address was not found.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This address was not found.' })).toBeFocused();
  await expect(page.locator('#route-status')).toHaveText('This address was not found. loaded.');
  await expect(page.getByRole('link', { name: 'Return to the import checker' })).toHaveAttribute('href', '/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('immutable artwork URLs contain the digest of the served file', async ({ page }) => {
  await page.goto('/');
  const paths = await page.evaluate(() => [
    document.querySelector<HTMLSourceElement>('.hero-art source')!.srcset,
    new URL(document.querySelector<HTMLImageElement>('.hero-art img')!.src).pathname,
    new URL(document.querySelector<HTMLMetaElement>('meta[property="og:image"]')!.content).pathname,
  ]);
  for (const path of paths) {
    const response = await page.request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['cache-control']).toContain('immutable');
    const digest = createHash('sha256').update(await response.body()).digest('hex').slice(0, 12);
    expect(path).toContain(digest);
  }
});
