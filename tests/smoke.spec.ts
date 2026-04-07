import { test, expect } from './coverage-fixture';
import type { Page, ConsoleMessage } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect uncaught page errors during a callback. */
async function withPageErrors(page: Page, fn: () => Promise<void>) {
  const errors: string[] = [];
  const handler = (err: Error) => errors.push(err.message);
  page.on('pageerror', handler);
  await fn();
  page.off('pageerror', handler);
  return errors;
}

/** Select a language category by its data-id. */
async function selectCategory(page: Page, id: string) {
  await page.click('.categoryButton > span');
  await page.click(`li[data-id="${id}"] button`);
}

/** Select a parser within the current category by its data-id. */
async function selectParser(page: Page, id: string) {
  await page.evaluate(() =>
    (document.querySelectorAll('#Toolbar > .menuButton')[2] as HTMLElement)
      .querySelector('span')!.click()
  );
  await page.evaluate((pid: string) => {
    const menu = document.querySelectorAll('#Toolbar > .menuButton')[2];
    (menu.querySelector(`li[data-id="${pid}"] button`) as HTMLElement).click();
  }, id);
}

/** Wait for an AST tree to appear in the output panel. */
async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

/** Get the displayed parse time (e.g. "42ms"). */
async function getParseTime(page: Page) {
  return page.evaluate(() => document.querySelector('.time')?.textContent || '');
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('AST Explorer smoke tests', () => {

  test('app loads without errors', async ({ page }) => {
    const errors = await withPageErrors(page, async () => {
      await page.goto('/');
      await page.waitForSelector('#Toolbar');
    });
    expect(errors).toEqual([]);
    await expect(page.locator('.categoryButton')).toBeVisible();
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('default parser (JavaScript/acorn) produces an AST', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    const time = await getParseTime(page);
    expect(time).toMatch(/\d+ms/);
    // Should have tree nodes
    await expect(page.locator('.tree-visualization li')).not.toHaveCount(0);
  });

  test('lazy loading: initial page has fewer JS files than total output', async ({ page }) => {
    // The initial load should NOT include all parser chunks.
    // Verify by checking that the output directory has many more .js files
    // than what the initial page load requests.
    const requestedScripts: string[] = [];
    page.on('request', (req) => {
      if (req.url().endsWith('.js')) requestedScripts.push(req.url());
    });

    await page.goto('/');
    await waitForTree(page);

    // Initial load should request only a handful of JS files (runtime, app, vendors, parsers metadata + default parser chunk)
    // The output dir has 145+ chunk files
    expect(requestedScripts.length).toBeLessThan(20);
  });

  test.describe('language categories', () => {
    const categories = [
      'css', 'glsl', 'go', 'graphql', 'graphviz', 'handlebars', 'htmlmixed',
      'icu', 'java', 'javascript', 'json', 'lua', 'lucene', 'markdown',
      'mathjs', 'mdx', 'monkey', 'ocaml', 'php', 'protobuf', 'pug',
      'python', 'reason', 'regexp', 'rust', 'san', 'text/x-scala',
      'solididy', 'sql', 'svelte', 'thrift-idl', 'vue', 'wat', 'webidl', 'yaml',
    ];

    for (const id of categories) {
      test(`${id} parser loads and produces AST`, async ({ page }) => {
        await page.goto('/');
        await waitForTree(page); // wait for default parser first

        const errors = await withPageErrors(page, async () => {
          await selectCategory(page, id);
          await waitForTree(page);
        });

        expect(errors).toEqual([]);
        const time = await getParseTime(page);
        expect(time).toMatch(/\d+ms/);
      });
    }
  });

  test('tree buttons have no browser-default borders', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    const borders = await page.evaluate(() => {
      const buttons = document.querySelectorAll('.tree-visualization button');
      return Array.from(buttons).slice(0, 10).map((btn) => {
        const style = getComputedStyle(btn);
        return {
          border: style.border,
          borderStyle: style.borderStyle,
          outline: style.outlineStyle,
        };
      });
    });

    for (const b of borders) {
      // Buttons in the tree must not have visible borders — they should
      // look like plain text, not OS-native buttons.
      expect(b.borderStyle, 'tree button has a visible border').toBe('none');
    }
  });

  test.describe('screenshots', () => {
    test('initial load', async ({ page }) => {
      await page.goto('/');
      await waitForTree(page);
      await expect(page).toHaveScreenshot('initial-load.png', { maxDiffPixelRatio: 0.01 });
    });

    test('CSS parser', async ({ page }) => {
      await page.goto('/');
      await waitForTree(page);
      await selectCategory(page, 'css');
      await waitForTree(page);
      await expect(page).toHaveScreenshot('css-parser.png', { maxDiffPixelRatio: 0.01 });
    });

    test('category dropdown', async ({ page }) => {
      await page.goto('/');
      await waitForTree(page);
      await page.click('.categoryButton > span');
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot('category-dropdown.png', { maxDiffPixelRatio: 0.01 });
    });

    // Syntax highlighting screenshots — verify Monaco languages load correctly
    const highlightCategories = [
      'css', 'go', 'handlebars', 'htmlmixed', 'java', 'json',
      'lua', 'markdown', 'php', 'python', 'rust', 'sql', 'yaml',
    ];
    for (const id of highlightCategories) {
      test(`${id} syntax highlighting`, async ({ page }) => {
        await page.goto('/');
        await waitForTree(page);
        await selectCategory(page, id);
        await waitForTree(page);
        // Wait for Monaco to apply syntax highlighting
        await page.waitForTimeout(500);
        await expect(page).toHaveScreenshot(`highlight-${id}.png`, { maxDiffPixelRatio: 0.01 });
      });
    }
  });

  test.describe('JavaScript parsers', () => {
    const parsers = [
      'acorn', '@babel/eslint-parser', 'babel-eslint9', 'babylon7',
      'esformatter-parser', 'espree', 'esprima', 'flow', 'hermes',
      'meriyah', 'recast', 'seafox', 'shift', 'swc', 'tenko',
      'traceur', '@typescript-eslint/parser', 'typescript', 'uglify-js',
    ];

    for (const id of parsers) {
      test(`${id} parser works`, async ({ page }) => {
        await page.goto('/');
        await waitForTree(page);

        const errors = await withPageErrors(page, async () => {
          await selectParser(page, id);
          await waitForTree(page);
        });

        expect(errors).toEqual([]);
      });
    }
  });
});
