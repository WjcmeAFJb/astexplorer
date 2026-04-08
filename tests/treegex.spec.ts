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

function getTransformOutputText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const outputs = document.querySelectorAll('.output.highlight');
    if (outputs.length < 2) return '';
    const output = outputs[1];
    const viewLines = output.querySelector('.monaco-editor .view-lines');
    return viewLines?.textContent ?? '';
  });
}

test.describe('tree-gex transformer E2E', () => {

  test('JavaScript: tree-gex produces JSON output with matches', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text).toContain('funcName');
    expect(text).toContain('FunctionDeclaration');
  });

  test('CSS: tree-gex produces output', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'css');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-css');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text.length).toBeGreaterThan(2);
  });

  test('GraphQL: tree-gex captures field definitions', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'graphql');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-graphql');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text).toContain('fieldName');
  });

  test('Markdown: tree-gex finds heading nodes', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'markdown');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-markdown');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text).toContain('nodeType');
  });

  test('JSON: tree-gex produces output', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'json');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-json');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text.length).toBeGreaterThan(2);
  });

  test('YAML: tree-gex produces output', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'yaml');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-yaml');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text.length).toBeGreaterThan(2);
  });

  test('RegExp: tree-gex captures char nodes', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'regexp');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-regexp');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text).toContain('charValue');
  });

  test('Handlebars: tree-gex produces output', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'handlebars');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-handlebars');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    expect(text.length).toBeGreaterThan(2);
  });

  test('tree-gex editor shows Monaco', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await page.waitForTimeout(1500);

    const editorCount = await page.locator('.monaco-editor').count();
    expect(editorCount).toBeGreaterThanOrEqual(2);
  });

  test('selecting tree-gex does NOT redirect to different category', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    const catBefore = await page.evaluate(() =>
      document.querySelector('.categoryButton span')?.textContent,
    );

    await selectTransformer(page, 'tree-gex-javascript');
    await page.waitForTimeout(500);

    const catAfter = await page.evaluate(() =>
      document.querySelector('.categoryButton span')?.textContent,
    );

    expect(catAfter).toBe(catBefore);
  });
});
