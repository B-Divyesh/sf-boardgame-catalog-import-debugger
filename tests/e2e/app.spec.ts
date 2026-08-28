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

test('mobile layout has no horizontal overflow and primary targets are large enough', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'mobile-only assertion');
  await page.goto('/');
  const sizes = await page.evaluate(() => ({ body: document.body.scrollWidth, viewport: document.documentElement.clientWidth }));
  expect(sizes.body).toBeLessThanOrEqual(sizes.viewport);
  const box = await page.getByRole('button', { name: 'Inspect URL' }).boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  expect(box?.width).toBeGreaterThanOrEqual(44);
});
