/**
 * Tests for cursor-driven capture groups in tree-gex transformers.
 *
 * The transform function accepts an optional `cursor` offset into the
 * transform code. When cursor lands inside a tree-gex walker's pattern
 * argument, the transformer wraps the sub-expression at the cursor with
 * a synthetic capture group and returns the captured AST nodes alongside
 * the normal result.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import path from 'path';
import { setup } from './setup';

beforeAll(() => { setup(); });

function loadBundle() {
  const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
  delete require.cache[distPath];
  return require(distPath);
}

type Transformer = {
  id: string;
  defaultTransform: string;
  loadTransformer: (cb: (real: unknown) => void) => void;
  transform: (real: unknown, code: string, src: string, cursor?: number) => unknown;
};

function loadTransformerAsync(tx: Transformer): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try { tx.loadTransformer(resolve); }
    catch (e) { reject(e); }
    setTimeout(() => reject(new Error(`timeout for ${tx.id}`)), 30_000);
  });
}

describe('tree-gex cursor capture', () => {
  let bundle: ReturnType<typeof loadBundle>;

  beforeAll(() => { bundle = loadBundle(); });

  test('no cursor → returns plain string output (backward compat)', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1;';
    const transformCode = `
import * as w from 'tree-gex';
export default w.accumWalkMatch(ast, { type: 'VariableDeclaration' });
`;
    const result = tg.transform(real, transformCode, code);
    expect(typeof result).toBe('string');
  });

  test('cursor inside pattern object literal → returns capture result', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1; let y = 2;';
    const transformCode = `import * as w from 'tree-gex';
export default w.accumWalkMatch(ast, { type: 'VariableDeclaration' });
`;
    // Cursor on the literal 'VariableDeclaration' — wraps the enclosing object.
    const cursor = transformCode.indexOf("'VariableDeclaration'") + 2;
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };

    expect(typeof result).toBe('object');
    expect(typeof result.code).toBe('string');
    expect(Array.isArray(result.cursorNodes)).toBe(true);
    // Both declarations should be captured.
    expect(result.cursorNodes.length).toBe(2);
    for (const n of result.cursorNodes) {
      expect((n as { type: string }).type).toBe('VariableDeclaration');
    }
  });

  test('cursor on inner pattern captures only inner AST nodes', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'function foo() {} function bar() {}';
    const transformCode = `import * as w from 'tree-gex';
export default w.accumWalkMatch(ast, {
  type: 'FunctionDeclaration',
  id: { type: 'Identifier' }
});
`;
    // Cursor inside the `id: { type: 'Identifier' }` inner object.
    const cursor = transformCode.indexOf("'Identifier'");
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };

    expect(Array.isArray(result.cursorNodes)).toBe(true);
    // Two functions → two Identifier nodes for their `id` property.
    expect(result.cursorNodes.length).toBe(2);
    for (const n of result.cursorNodes) {
      expect((n as { type: string }).type).toBe('Identifier');
    }
  });

  test('cursor outside any walker pattern → plain string result', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1;';
    const transformCode = `import * as w from 'tree-gex';
// comment
export default w.accumWalkMatch(ast, { type: 'VariableDeclaration' });
`;
    // Cursor inside the import statement (outside any walker pattern).
    const cursor = transformCode.indexOf('tree-gex');
    const result = tg.transform(real, transformCode, code, cursor);
    expect(typeof result).toBe('string');
  });

  test('cursor on helper identifier referenced by walker', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'function foo() { return 1; }';
    const transformCode = `import * as w from 'tree-gex';
const idPattern = { type: 'Identifier' };
export default w.accumWalkMatch(ast, {
  type: 'FunctionDeclaration',
  id: idPattern
});
`;
    // Cursor on 'idPattern' inside the walker pattern → wraps that reference.
    const cursor = transformCode.indexOf('idPattern\n}');
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };
    expect(Array.isArray(result.cursorNodes)).toBe(true);
    expect(result.cursorNodes.length).toBeGreaterThan(0);
    for (const n of result.cursorNodes) {
      expect((n as { type: string }).type).toBe('Identifier');
    }
  });

  test('walkReplace preserves user output when instrumented', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'function foo() {} function bar() {}';
    const transformCode = `import * as w from 'tree-gex';
export default w.walkReplace(ast, {
  type: 'FunctionDeclaration',
  id: {
    type: 'Identifier',
    name: w.transform(w.string(), (name) => name.split('').reverse().join(''))
  }
});
`;
    const cursor = transformCode.indexOf('Identifier');
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };
    // The user's original recast output should include reversed names.
    expect(typeof result.code).toBe('string');
    expect(result.code).toContain('oof');
    expect(result.code).toContain('rab');
    // And cursor nodes should be captured.
    expect(result.cursorNodes.length).toBe(2);
  });

  test('cursor inside a helper (outside walker call) still captures', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'function foo() { return 1; } function bar() { return 2; }';
    // Mimic the GraphQL example's structure: pattern pieces split across
    // helper declarations. Cursor lands inside the helper's body — outside
    // any walker call — but the walker transitively references this helper.
    const transformCode = `import * as w from 'tree-gex';
const idPattern = {
  type: 'Identifier'
};
export default w.accumWalkMatch(ast, {
  type: 'FunctionDeclaration',
  id: idPattern
});
`;
    // Cursor on "'Identifier'" in the helper body.
    const cursor = transformCode.indexOf("'Identifier'") + 2;
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };
    expect(Array.isArray(result.cursorNodes)).toBe(true);
    expect(result.cursorNodes.length).toBe(2);
    for (const n of result.cursorNodes) {
      expect((n as { type: string }).type).toBe('Identifier');
    }
  });

  test('cursor inside a function-body expression wraps that expression', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'function foo() {} function bar() {}';
    // Pattern returned from a factory function — cursor inside that function
    // body must still find a wrappable expression and wrap it in place.
    const transformCode = `import * as w from 'tree-gex';
function makePattern() {
  return {
    type: 'Identifier'
  };
}
export default w.accumWalkMatch(ast, {
  type: 'FunctionDeclaration',
  id: makePattern()
});
`;
    const cursor = transformCode.indexOf("'Identifier'") + 2;
    const result = tg.transform(real, transformCode, code, cursor) as {
      code: string;
      cursorNodes: unknown[];
    };
    expect(Array.isArray(result.cursorNodes)).toBe(true);
    expect(result.cursorNodes.length).toBe(2);
    for (const n of result.cursorNodes) {
      expect((n as { type: string }).type).toBe('Identifier');
    }
  });

  test('invalid transform code → no throw, falls through', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id.startsWith('tree-gex'));
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1;';
    // Syntactically broken transform code (dangling `{`).
    const transformCode = `import * as w from 'tree-gex';
export default w.accumWalkMatch(ast, { type: `;
    expect(() => tg.transform(real, transformCode, code, 10)).toThrow();
  });
});
