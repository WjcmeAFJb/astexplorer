import { test, expect } from './coverage-fixture';
import type { Page } from '@playwright/test';

/** Wait for an AST tree to appear. */
async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

test.describe('PWA', () => {

  test('serves a valid web app manifest', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    expect(response?.status()).toBe(200);
    const manifest = await response?.json();
    expect(manifest.name).toBe('AST Explorer');
    expect(manifest.short_name).toBe('AST Explorer');
    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.theme_color).toBeTruthy();
    expect(manifest.background_color).toBeTruthy();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    // At least one 192x192 and one 512x512
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '192x192')).toBe(true);
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === '512x512')).toBe(true);
  });

  test('HTML has manifest link', async ({ page }) => {
    await page.goto('/');
    const link = await page.$('link[rel="manifest"]');
    expect(link).not.toBeNull();
    const href = await link?.getAttribute('href');
    expect(href).toContain('manifest');
  });

  test('HTML has theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    const meta = await page.$('meta[name="theme-color"]');
    expect(meta).not.toBeNull();
    const content = await meta?.getAttribute('content');
    expect(content).toBeTruthy();
  });

  test('HTML has viewport meta tag', async ({ page }) => {
    await page.goto('/');
    const meta = await page.$('meta[name="viewport"]');
    expect(meta).not.toBeNull();
  });

  test('HTML has apple-touch-icon', async ({ page }) => {
    await page.goto('/');
    const link = await page.$('link[rel="apple-touch-icon"]');
    expect(link).not.toBeNull();
  });

  test('PWA icons are accessible', async ({ page }) => {
    const r192 = await page.goto('/pwa-192.png');
    expect(r192?.status()).toBe(200);
    expect(r192?.headers()['content-type']).toContain('image/png');

    const r512 = await page.goto('/pwa-512.png');
    expect(r512?.status()).toBe(200);
    expect(r512?.headers()['content-type']).toContain('image/png');
  });

  test('service worker is registered', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Wait for service worker to register
    const swRegistered = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return false;
      // Give it time to register
      await new Promise((r) => setTimeout(r, 2000));
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length > 0;
    });
    expect(swRegistered).toBe(true);
  });

  test('service worker script is accessible', async ({ page }) => {
    const response = await page.goto('/sw.js');
    expect(response?.status()).toBe(200);
    const text = await response?.text();
    expect(text).toContain('precacheAndRoute');
    expect(text).toContain('workbox');
  });

  test('service worker precaches core assets', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const text = await response?.text();
    // Verify critical assets are in the precache manifest
    expect(text).toContain('index.html');
    expect(text).toContain('index-');
    expect(text).toContain('.css');
  });

  test('service worker has runtime caching for parsers', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const text = await response?.text();
    expect(text).toContain('parser-chunks');
    expect(text).toContain('CacheFirst');
  });

  test('service worker has runtime caching for Monaco', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const text = await response?.text();
    expect(text).toContain('monaco');
  });

  test('service worker has runtime caching for WASM', async ({ page }) => {
    const response = await page.goto('/sw.js');
    const text = await response?.text();
    expect(text).toContain('wasm');
  });

  test('app works after going offline', async ({ page, context }) => {
    // First load — fetches and caches everything
    await page.goto('/');
    await waitForTree(page);

    // Wait for service worker to install and activate
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      // Wait for the service worker to be active
      if (reg.active?.state !== 'activated') {
        await new Promise<void>((resolve) => {
          reg.active?.addEventListener('statechange', () => {
            if (reg.active?.state === 'activated') resolve();
          });
          // Resolve if already active
          if (reg.active?.state === 'activated') resolve();
          // Timeout fallback
          setTimeout(resolve, 3000);
        });
      }
    });

    // Go offline
    await context.setOffline(true);

    // Navigate again — should be served from cache
    await page.goto('/');
    await page.waitForSelector('#Toolbar', { timeout: 10_000 });
    await expect(page.locator('.monaco-editor')).toBeVisible();

    // Restore online
    await context.setOffline(false);
  });
});
