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
    // Note: Monaco virtualizes rendering so only visible lines are in the DOM.
    // For long output, only the first screenful of text is returned.
    // Monaco renders spaces as non-breaking spaces (U+00A0) in the DOM,
    // so we normalize them to regular spaces for easier assertion.
    const viewLines = output.querySelector('.monaco-editor .view-lines');
    return (viewLines?.textContent ?? '').replace(/\u00a0/g, ' ');
  });
}

test.describe('tree-gex transformer E2E', () => {

  test('JavaScript: tree-gex reverses function names via walkReplace', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    // The default JS code has `function printTips()`.
    // walkReplace reverses it to `spiTtnirp`.
    expect(text).toContain('spiTtnirp');
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

  test('GraphQL: tree-gex captures field names', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'graphql');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-graphql');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    // accumWalkMatch returns JSON with matched Field nodes
    expect(text).toContain('"Field"');
    expect(text).toContain('user');
  });

  test('Markdown: tree-gex increases heading depth via walkReplace', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'markdown');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-markdown');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    // Default markdown has `# Hello` heading. walkReplace bumps depth: # -> ##
    expect(text).toContain('## Hello');
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

  test('RegExp: tree-gex replaces chars via walkReplace', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'regexp');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-regexp');
    await waitForTransformOutput(page);

    const text = await getTransformOutputText(page);
    // walkReplace replaces 'a' with 'b' in the regex
    expect(text).toContain('b-z');
  });

  test('Handlebars: tree-gex produces output', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'handlebars');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-handlebars');
    await waitForTransformOutput(page, 60_000);

    const text = await getTransformOutputText(page);
    // accumWalkMatch finds MustacheStatement helpers (title, body)
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

  test('tree-gex editor has TypeScript syntax highlighting', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await page.waitForTimeout(3000);

    // The tree-gex editor is the second Monaco editor on the page.
    // Check that it has multiple token classes (not just mtk1 = plaintext).
    const tokenClassCount = await page.evaluate(() => {
      const editors = document.querySelectorAll('.monaco-editor');
      if (editors.length < 2) return 0;
      const treeGexEditor = editors[1];
      const classes = new Set<string>();
      treeGexEditor.querySelectorAll('[class*="mtk"]').forEach(el => {
        el.classList.forEach(c => { if (c.startsWith('mtk')) classes.add(c); });
      });
      return classes.size;
    });

    // Multiple token classes indicates TypeScript syntax highlighting is active.
    // Plaintext only has mtk1, TypeScript has mtk1, mtk6, mtk8, mtk20, etc.
    expect(tokenClassCount).toBeGreaterThan(1);
  });

  test('tree-gex editor is reactive: output updates when code changes', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await waitForTransformOutput(page);

    const initialText = await getTransformOutputText(page);
    expect(initialText).toContain('spiTtnirp');

    // Find and focus the tree-gex editor, then replace its content.
    // We directly call the React component's onContentChange prop to ensure
    // the test doesn't depend on Playwright keyboard simulation details.
    await page.evaluate(() => {
      const editors = document.querySelectorAll('.monaco-editor');
      for (let i = 0; i < editors.length; i++) {
        const text = editors[i].querySelector('.view-lines')?.textContent ?? '';
        if (!text.includes('tree-gex')) continue;
        const editorEl = editors[i].closest('.editor');
        if (!editorEl) continue;
        const fiberKey = Object.keys(editorEl).find(k => k.startsWith('__reactFiber$'));
        if (!fiberKey) continue;
        let fiber = (editorEl as any)[fiberKey];
        while (fiber) {
          const inst = fiber.stateNode;
          if (inst?.monacoEditor && inst.props?.onContentChange) {
            const newCode = 'export default "reactivity-test";';
            inst.monacoEditor.setValue(newCode);
            inst.props.onContentChange({ value: newCode, cursor: 0 });
            break;
          }
          fiber = fiber.return;
        }
        break;
      }
    });

    // Wait for the output to change
    await page.waitForFunction(
      () => {
        const outputs = document.querySelectorAll('.output.highlight');
        if (outputs.length < 2) return false;
        const viewLines = outputs[1].querySelector('.monaco-editor .view-lines');
        const text = (viewLines?.textContent ?? '').replace(/\u00a0/g, ' ');
        return text.includes('reactivity-test');
      },
      undefined,
      { timeout: 15_000 },
    );

    const updatedText = await getTransformOutputText(page);
    expect(updatedText).toContain('reactivity-test');
  });

  test('tree-gex editor screenshot', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await waitForTransformOutput(page);
    await page.waitForTimeout(2000);

    // Screenshot the tree-gex editor pane (second editor)
    const editors = page.locator('.monaco-editor');
    const treeGexEditor = editors.nth(1);
    await expect(treeGexEditor).toHaveScreenshot('treegex-editor-js.png', {
      maxDiffPixels: 100,
    });
  });

  test('tree-gex output screenshot', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectTransformer(page, 'tree-gex-javascript');
    await waitForTransformOutput(page);
    await page.waitForTimeout(1000);

    // Screenshot the transform output pane
    const output = page.locator('.output.highlight').nth(1);
    await expect(output).toHaveScreenshot('treegex-output-js.png', {
      maxDiffPixels: 100,
    });
  });
});
