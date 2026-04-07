import { test, expect } from './coverage-fixture';
import type { Page } from '@playwright/test';

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

/** Wait for an AST tree to appear in the output panel. */
async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

/** Select a transformer from the Transform dropdown menu. */
async function selectTransformer(page: Page, id: string) {
  await page.evaluate((tid: string) => {
    const menuButtons = document.querySelectorAll('#Toolbar > .menuButton');
    const transformMenu = menuButtons[3];
    const btn = transformMenu.querySelector(
      `button[value="${tid}"]`,
    ) as HTMLElement;
    if (!btn) throw new Error(`Transformer button not found: ${tid}`);
    btn.click();
  }, id);
}

/**
 * Wait for the transform output panel to appear and contain output.
 * The transform output is the second `.output.highlight` element on the page
 * (the first is the AST output panel).
 */
async function waitForTransformOutput(page: Page, timeout = 30_000) {
  await page.locator('.output.highlight').nth(1).waitFor({ state: 'visible', timeout });
  await page.waitForFunction(
    () => {
      const outputs = document.querySelectorAll('.output.highlight');
      if (outputs.length < 2) return false;
      const output = outputs[1];
      // Check Monaco editor (used for string results and errors)
      const monacoEl = output.querySelector('.monaco-editor');
      if (monacoEl) {
        const viewLines = monacoEl.querySelector('.view-lines');
        if (viewLines && viewLines.textContent && viewLines.textContent.length > 0) {
          return true;
        }
      }
      // Check JSONEditor (used for non-string/object results like glimmer-compiler)
      const jsonMonaco = output.querySelector('#JSONEditor .monaco-editor');
      if (jsonMonaco) {
        const jsonLines = jsonMonaco.querySelector('.view-lines');
        if (jsonLines && jsonLines.textContent && jsonLines.textContent.length > 0) {
          return true;
        }
      }
      return false;
    },
    { timeout },
  );
}

// ---------------------------------------------------------------------------
// Transformer definitions
// ---------------------------------------------------------------------------

type TransformerDef = {
  category: string;
  id: string;
  name: string;
};

const transformers: TransformerDef[] = [
  // JavaScript
  { category: 'javascript', id: 'babel-plugin-macros', name: 'babel-plugin-macros' },
  { category: 'javascript', id: 'babelv7', name: 'babelv7' },
  { category: 'javascript', id: 'eslint-v4', name: 'ESLint v4' },
  { category: 'javascript', id: 'eslint-v8', name: 'ESLint v8' },
  { category: 'javascript', id: 'jscodeshift', name: 'jscodeshift' },
  { category: 'javascript', id: 'prettier', name: 'prettier' },
  { category: 'javascript', id: 'recast', name: 'recast' },
  { category: 'javascript', id: 'tslint', name: 'tslint' },
  { category: 'javascript', id: 'typescript', name: 'typescript' },
  // CSS
  { category: 'css', id: 'postcss', name: 'postcss' },
  // HTML
  { category: 'htmlmixed', id: 'posthtml', name: 'posthtml' },
  { category: 'htmlmixed', id: 'svelte', name: 'svelte' },
  // Handlebars
  { category: 'handlebars', id: 'ember-template-recast', name: 'ember-template-recast' },
  { category: 'handlebars', id: 'glimmer', name: 'glimmer' },
  { category: 'handlebars', id: 'glimmer-compiler', name: 'glimmer-compiler' },
  // Markdown
  { category: 'markdown', id: 'remark', name: 'remark' },
  // MDX
  { category: 'mdx', id: 'mdx', name: 'mdx' },
  // Regexp
  { category: 'regexp', id: 'regexp-tree', name: 'regexp-tree' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Transformer tests', () => {
  for (const { category, id, name } of transformers) {
    test(`${category}/${name} transformer loads and produces output`, async ({ page }) => {
      await page.goto('/');
      await waitForTree(page);

      // Switch category if not JavaScript (the default)
      if (category !== 'javascript') {
        await selectCategory(page, category);
        await waitForTree(page);
      }

      const errors = await withPageErrors(page, async () => {
        await selectTransformer(page, id);
        await waitForTransformOutput(page);
      });

      expect(errors).toEqual([]);
    });
  }
});
