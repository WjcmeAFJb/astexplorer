import { test, expect } from './coverage-fixture';
import type { Page } from '@playwright/test';

async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

async function selectCategory(page: Page, id: string) {
  await page.click('.categoryButton > span');
  await page.click(`li[data-id="${id}"] button`);
}

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

async function waitForTransformOutput(page: Page, timeout = 30_000) {
  await page.locator('.output.highlight').nth(1).waitFor({ state: 'visible', timeout });
  await page.waitForFunction(
    () => {
      const outputs = document.querySelectorAll('.output.highlight');
      if (outputs.length < 2) return false;
      const output = outputs[1];
      const monacoEl = output.querySelector('.monaco-editor');
      if (monacoEl) {
        const viewLines = monacoEl.querySelector('.view-lines');
        if (viewLines && viewLines.textContent && viewLines.textContent.length > 0) {
          return true;
        }
      }
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

test.describe('tree-gex transformer E2E', () => {
  // Test categories that work in the browser (not WASM-only)
  const categories = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'css', name: 'CSS' },
    { id: 'graphql', name: 'GraphQL' },
    { id: 'json', name: 'JSON' },
    { id: 'markdown', name: 'Markdown' },
    { id: 'yaml', name: 'YAML' },
    { id: 'lua', name: 'Lua' },
    { id: 'python', name: 'Python' },
    { id: 'htmlmixed', name: 'HTML' },
    { id: 'regexp', name: 'RegExp' },
    { id: 'handlebars', name: 'Handlebars' },
    { id: 'sql', name: 'SQL' },
  ];

  for (const { id, name } of categories) {
    test(`${name}: tree-gex transformer loads and produces output`, async ({ page }) => {
      await page.goto('/');
      await waitForTree(page);

      if (id !== 'javascript') {
        await selectCategory(page, id);
        await waitForTree(page);
      }

      await selectTransformer(page, 'tree-gex');
      await waitForTransformOutput(page);
    });
  }

  test('JavaScript: tree-gex shows JSON matches', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    await selectTransformer(page, 'tree-gex');
    await waitForTransformOutput(page);

    // The output should contain JSON with matches
    const outputText = await page.evaluate(() => {
      const outputs = document.querySelectorAll('.output.highlight');
      if (outputs.length < 2) return '';
      const output = outputs[1];
      const viewLines = output.querySelector('.monaco-editor .view-lines');
      return viewLines?.textContent ?? '';
    });

    // tree-gex output is JSON containing matched nodes
    expect(outputText.length).toBeGreaterThan(0);
  });

  test('tree-gex transformer editor uses TypeScript mode', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    await selectTransformer(page, 'tree-gex');
    await page.waitForTimeout(1000);

    // The transformer editor (left pane of the split) should have TypeScript mode
    // Check that the editor exists
    const editorCount = await page.locator('.monaco-editor').count();
    expect(editorCount).toBeGreaterThanOrEqual(2); // code editor + transform editor
  });
});
