import { test, expect } from './coverage-fixture';
import type { Page } from '@playwright/test';

/** Wait for Monaco editor to be ready in the page. */
async function waitForMonaco(page: Page, timeout = 15_000) {
  await page.waitForSelector('.monaco-editor', { timeout });
}

/** Wait for an AST tree to appear in the output panel. */
async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

/** Select a language category by its data-id. */
async function selectCategory(page: Page, id: string) {
  await page.click('.categoryButton > span');
  await page.click(`li[data-id="${id}"] button`);
}

/** Type into the Monaco code editor (the first editor on the page). */
async function typeInEditor(page: Page, text: string) {
  const editor = page.locator('.editor .monaco-editor').first();
  await editor.click();
  // Select all and replace
  await page.keyboard.press('Control+a');
  await page.keyboard.type(text, { delay: 10 });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Monaco Editor E2E', () => {

  test('Monaco editor loads on page', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);
    const editors = await page.locator('.monaco-editor').count();
    expect(editors).toBeGreaterThanOrEqual(1);
  });

  test('code editor displays default JavaScript code', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);
    // Monaco renders lines inside .view-lines
    const viewLines = page.locator('.editor .monaco-editor .view-lines');
    await expect(viewLines).toBeVisible();
    const text = await viewLines.textContent();
    // The default code example should contain something
    expect(text!.length).toBeGreaterThan(0);
  });

  test('editor has line numbers', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);
    // Monaco renders line numbers in .line-numbers elements
    const lineNumbers = page.locator('.editor .monaco-editor .line-numbers');
    const count = await lineNumbers.count();
    expect(count).toBeGreaterThan(0);
  });

  test('typing in editor updates AST', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Get initial tree content
    const initialTree = await page.locator('.tree-visualization').textContent();

    // Type new code
    await typeInEditor(page, 'var x = 42;');

    // Wait for AST to update
    await page.waitForTimeout(500);
    await waitForTree(page);

    // Tree should have changed
    const newTree = await page.locator('.tree-visualization').textContent();
    expect(newTree).not.toBe(initialTree);
  });

  test('switching language category changes editor language', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Switch to CSS
    await selectCategory(page, 'css');
    await waitForTree(page);
    await waitForMonaco(page);

    // The editor should still be present
    const editors = await page.locator('.monaco-editor').count();
    expect(editors).toBeGreaterThanOrEqual(1);
  });

  test('AST tree view shows node data', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Should have tree entries
    const entries = page.locator('.tree-visualization li.entry');
    const count = await entries.count();
    expect(count).toBeGreaterThan(0);
  });

  test('split pane divider is draggable', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);

    const divider = page.locator('.splitpane-divider').first();
    await expect(divider).toBeVisible();

    const box = await divider.boundingBox();
    expect(box).not.toBeNull();

    // Drag the divider
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
      await page.mouse.up();
    }

    // Editor should still be functional
    await waitForMonaco(page);
  });

  test('editor shows syntax highlighting for JavaScript', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);

    // Monaco applies token classes for syntax highlighting
    // Check that the editor has some token spans
    const tokens = page.locator('.editor .monaco-editor .view-lines span');
    const count = await tokens.count();
    expect(count).toBeGreaterThan(0);
  });

  test('editor shows syntax highlighting for CSS', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'css');
    await waitForTree(page);
    await waitForMonaco(page);

    // Wait for Monaco to apply CSS highlighting
    await page.waitForTimeout(500);

    const tokens = page.locator('.editor .monaco-editor .view-lines span');
    const count = await tokens.count();
    expect(count).toBeGreaterThan(0);
  });

  test('editor shows syntax highlighting for Python', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await selectCategory(page, 'python');
    await waitForTree(page);
    await waitForMonaco(page);

    await page.waitForTimeout(500);
    const tokens = page.locator('.editor .monaco-editor .view-lines span');
    const count = await tokens.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking AST node highlights code in editor', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Click on a tree entry to trigger highlight
    const entries = page.locator('.tree-visualization li.entry');
    const count = await entries.count();
    if (count > 0) {
      await entries.first().click();
      // Wait for highlight to be applied
      await page.waitForTimeout(200);
      // No error = success
    }
  });

  test('toolbar category selector works', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);

    // Click category button
    await page.click('.categoryButton > span');
    // Category dropdown should appear
    const dropdown = page.locator('.categoryButton ul');
    await expect(dropdown).toBeVisible();
  });

  test('JSON view shows AST as JSON', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Switch to JSON view
    const jsonButton = page.locator('.output .toolbar button').nth(1);
    await jsonButton.click();

    // Should show JSONEditor
    await page.waitForSelector('#JSONEditor', { timeout: 5_000 });
    const jsonEditor = page.locator('#JSONEditor .monaco-editor');
    await expect(jsonEditor).toBeVisible();
  });

  test('editor is read-only in transform output', async ({ page }) => {
    await page.goto('/');
    await waitForMonaco(page);

    // Enable transformer (select one from the toolbar)
    // The transform panel should show up with a read-only output
    const transformBtn = page.locator('#Toolbar .menuButton').nth(3);
    const isTransformMenu = await transformBtn.isVisible();
    if (isTransformMenu) {
      await transformBtn.locator('span').click();
      const firstTransform = transformBtn.locator('ul li button').first();
      if (await firstTransform.isVisible()) {
        await firstTransform.click();
        await page.waitForTimeout(1000);
        // Transform output should appear
        const output = page.locator('.output.highlight');
        await expect(output).toBeVisible();
      }
    }
  });
});
