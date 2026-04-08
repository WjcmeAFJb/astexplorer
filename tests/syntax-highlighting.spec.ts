import { test, expect } from './coverage-fixture';
import type { Page } from '@playwright/test';

/** Wait for Monaco editor to be ready. */
async function waitForMonaco(page: Page, timeout = 15_000) {
  await page.waitForSelector('.monaco-editor', { timeout });
}

/** Wait for an AST tree to appear. */
async function waitForTree(page: Page, timeout = 15_000) {
  await page.waitForSelector('.tree-visualization ul', { timeout });
}

/** Select a language category by its data-id. */
async function selectCategory(page: Page, id: string) {
  await page.click('.categoryButton > span');
  await page.click(`li[data-id="${id}"] button`);
}

/**
 * Count distinct Monaco token classes in the code editor.
 * Monaco assigns classes like mtk1, mtk5, mtk6, etc. to syntax tokens.
 * Plain text (no highlighting) uses only mtk1. Highlighted code uses multiple.
 */
async function countDistinctTokenClasses(page: Page): Promise<number> {
  return page.evaluate(() => {
    const editor = document.querySelector('.editor .monaco-editor');
    if (!editor) return 0;
    const spans = editor.querySelectorAll('.view-lines span span');
    const classes = new Set<string>();
    for (const span of spans) {
      for (const cls of span.classList) {
        if (cls.startsWith('mtk')) classes.add(cls);
      }
    }
    return classes.size;
  });
}

test.describe('Syntax highlighting', () => {

  test('JavaScript code has syntax highlighting on initial load', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    // Wait for language contribution to load and tokenizer to run
    await page.waitForTimeout(1000);

    const tokenClasses = await countDistinctTokenClasses(page);
    // JavaScript should have multiple token types (keywords, strings, identifiers, etc.)
    expect(tokenClasses).toBeGreaterThan(1);
  });

  test('CSS code has syntax highlighting after category switch', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    await selectCategory(page, 'css');
    await waitForTree(page);
    await page.waitForTimeout(1000);

    const tokenClasses = await countDistinctTokenClasses(page);
    expect(tokenClasses).toBeGreaterThan(1);
  });

  test('Python code has syntax highlighting after category switch', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    await selectCategory(page, 'python');
    await waitForTree(page);
    await page.waitForTimeout(1000);

    const tokenClasses = await countDistinctTokenClasses(page);
    expect(tokenClasses).toBeGreaterThan(1);
  });

  test('HTML code has syntax highlighting after category switch', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    await selectCategory(page, 'htmlmixed');
    await waitForTree(page);
    await page.waitForTimeout(1000);

    const tokenClasses = await countDistinctTokenClasses(page);
    expect(tokenClasses).toBeGreaterThan(1);
  });

  test('JSON AST view has syntax highlighting', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);

    // Switch to JSON AST view
    const jsonButton = page.locator('.output .toolbar button').nth(1);
    await jsonButton.click();
    await page.waitForSelector('#JSONEditor .monaco-editor', { timeout: 5_000 });
    await page.waitForTimeout(1000);

    // Check JSON editor has syntax highlighting
    const tokenClasses = await page.evaluate(() => {
      const editor = document.querySelector('#JSONEditor .monaco-editor');
      if (!editor) return 0;
      const spans = editor.querySelectorAll('.view-lines span span');
      const classes = new Set<string>();
      for (const span of spans) {
        for (const cls of span.classList) {
          if (cls.startsWith('mtk')) classes.add(cls);
        }
      }
      return classes.size;
    });
    expect(tokenClasses).toBeGreaterThan(1);
  });

  test('syntax highlighting persists after editing code', async ({ page }) => {
    await page.goto('/');
    await waitForTree(page);
    await page.waitForTimeout(1000);

    // Verify initial highlighting
    const before = await countDistinctTokenClasses(page);
    expect(before).toBeGreaterThan(1);

    // Click in editor and type some code
    const editor = page.locator('.editor .monaco-editor').first();
    await editor.click();
    await page.keyboard.press('End');
    await page.keyboard.type('\nconst y = "hello";', { delay: 20 });
    await page.waitForTimeout(500);

    // Highlighting should still be active
    const after = await countDistinctTokenClasses(page);
    expect(after).toBeGreaterThan(1);
  });

  test.describe('language-specific highlighting', () => {
    const languages = [
      { category: 'css', name: 'CSS' },
      { category: 'go', name: 'Go' },
      { category: 'lua', name: 'Lua' },
      { category: 'markdown', name: 'Markdown' },
      { category: 'python', name: 'Python' },
      { category: 'rust', name: 'Rust' },
      { category: 'sql', name: 'SQL' },
      { category: 'yaml', name: 'YAML' },
    ];

    for (const { category, name } of languages) {
      test(`${name} has multiple token types`, async ({ page }) => {
        await page.goto('/');
        await waitForTree(page);

        await selectCategory(page, category);
        await waitForTree(page);
        await page.waitForTimeout(1000);

        const tokenClasses = await countDistinctTokenClasses(page);
        expect(tokenClasses, `${name} should have syntax highlighting`).toBeGreaterThan(1);
      });
    }
  });
});
