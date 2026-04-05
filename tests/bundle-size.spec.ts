import { test, expect } from './coverage-fixture';

test.describe('Bundle size and lazy loading', () => {

  test('initial page load transfers less than 2MB of JS', async ({ page }) => {
    const jsResponses: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.endsWith('.mjs')) {
        const body = await response.body().catch(() => null);
        if (body) {
          jsResponses.push({ url: url.replace(/.*\//, ''), size: body.length });
        }
      }
    });

    await page.goto('/');
    await page.waitForSelector('.tree-visualization ul', { timeout: 30000 });

    const totalJSBytes = jsResponses.reduce((sum, r) => sum + r.size, 0);
    const totalJSMB = totalJSBytes / (1024 * 1024);

    // Log details for debugging
    console.log(`Initial JS files loaded: ${jsResponses.length}`);
    console.log(`Total JS size: ${totalJSMB.toFixed(2)} MB (${totalJSBytes} bytes)`);
    for (const r of jsResponses.sort((a, b) => b.size - a.size).slice(0, 10)) {
      console.log(`  ${r.url}: ${(r.size / 1024).toFixed(1)} KB`);
    }

    // Initial JS load must be under 2MB uncompressed
    expect(totalJSMB).toBeLessThan(2);
  });

  test('initial JS + CSS under 2MB', async ({ page }) => {
    const responses: { url: string; size: number }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if ((url.endsWith('.js') || url.endsWith('.mjs') || url.endsWith('.css')) &&
          url.startsWith('http://localhost:8080')) {
        const body = await response.body().catch(() => null);
        if (body) {
          responses.push({ url: url.replace(/.*\//, ''), size: body.length });
        }
      }
    });

    await page.goto('/');
    await page.waitForSelector('.tree-visualization ul', { timeout: 30000 });

    const totalBytes = responses.reduce((sum, r) => sum + r.size, 0);
    const totalMB = totalBytes / (1024 * 1024);

    console.log(`Total initial JS+CSS: ${totalMB.toFixed(2)} MB`);

    expect(totalMB).toBeLessThan(2);
  });

  test('not all parser chunks are loaded on initial page load', async ({ page }) => {
    const jsFiles: string[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.endsWith('.mjs')) {
        jsFiles.push(url.replace(/.*\//, ''));
      }
    });

    await page.goto('/');
    await page.waitForSelector('.tree-visualization ul', { timeout: 30000 });

    // Count how many parser chunks were loaded
    const parserChunks = jsFiles.filter(f => f.startsWith('chunk-'));
    console.log(`Initial load: ${jsFiles.length} JS files, ${parserChunks.length} parser chunks`);

    // The parsers dist has 129 chunks. Initial load should use far fewer.
    expect(parserChunks.length).toBeLessThan(20);
    expect(parserChunks.length).toBeGreaterThan(0); // default parser needs at least one chunk
  });
});
