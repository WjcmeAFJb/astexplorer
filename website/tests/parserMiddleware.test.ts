/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi } from 'vitest';

// Cache parser objects so identity checks (===) work in middleware
const parserCache: Record<string, any> = {};
function getOrCreateParser(id: string) {
  if (!parserCache[id]) {
    parserCache[id] = {
      id,
      category: { id: 'javascript', codeExample: '// js' },
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc', 'start', 'end']),
      typeProps: new Set(['type']),
      showInMenu: true,
      loadParser: (cb: (p: unknown) => void) => cb({ parse: (code: string) => ({ type: 'Program', body: [], code }) }),
      parse: (realParser: any, code: string) => realParser.parse(code),
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) { if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false }; },
      getDefaultOptions: () => ({}),
      hasSettings: () => false,
    };
  }
  return parserCache[id];
}
vi.mock('astexplorer-parsers', () => ({
  getParserByID: (id: string) => getOrCreateParser(id),
  getCategoryByID: (id: string) => ({ id, codeExample: '// example' }),
  getDefaultParser: () => getOrCreateParser('acorn'),
  getTransformerByID: () => undefined,
}));

import parserMiddleware from '../src/store/parserMiddleware';

function makeState(overrides: Record<string, any> = {}) {
  return {
    workbench: {
      parser: 'acorn',
      parserSettings: null,
      code: 'const x = 1;',
      initialCode: 'const x = 1;',
      keyMap: 'default',
      parseResult: undefined,
      transform: { transformer: '', code: '', initialCode: '', transformResult: null },
    },
    showTransformPanel: false,
    activeRevision: null,
    enableFormatting: false,
    ...overrides,
  };
}

describe('parserMiddleware', () => {
  test('dispatches SET_PARSE_RESULT on INIT', async () => {
    const state = makeState();
    // Middleware reads oldState before next(), newState after.
    // For INIT, the action.type === 'INIT' branch always triggers.
    const store = { getState: vi.fn(() => state) };
    const next = vi.fn();
    const middleware = parserMiddleware(store)(next);
    const result = middleware({ type: 'INIT' });
    expect(next).toHaveBeenCalledWith({ type: 'INIT' });
    await result;
    const parseResultCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT',
    );
    expect(parseResultCalls.length).toBeGreaterThan(0);
    const pr = parseResultCalls[0][0].result;
    expect(pr.ast).toBeTruthy();
    expect(typeof pr.time).toBe('number');
    expect(pr.error).toBeNull();
    expect(pr.treeAdapter).toBeTruthy();
  });

  test('does not parse when code is null', async () => {
    const state = makeState();
    state.workbench.code = null as any;
    const store = { getState: () => state };
    const next = vi.fn();
    const middleware = parserMiddleware(store)(next);
    await middleware({ type: 'INIT' });
    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults).toHaveLength(0);
  });

  test('ignores unrelated actions', async () => {
    const state = makeState();
    // Make old and new state identical so no re-parse
    const store = { getState: () => state };
    const next = vi.fn();
    const middleware = parserMiddleware(store)(next);
    await middleware({ type: 'OPEN_SETTINGS_DIALOG' });
    // Only the forwarded action, no SET_PARSE_RESULT
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0].type).toBe('OPEN_SETTINGS_DIALOG');
  });

  test('dispatches error result on parse failure', async () => {
    const failingParser = {
      id: 'failing',
      _ignoredProperties: new Set(),
      locationProps: new Set(),
      typeProps: new Set(['type']),
      loadParser: (cb: any) => cb({}),
      parse: () => { throw new SyntaxError('bad syntax'); },
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: () => '',
      *forEachProperty() {},
      getDefaultOptions: () => ({}),
    };

    const { getParserByID } = await import('astexplorer-parsers');
    const orig = getParserByID;
    (await import('astexplorer-parsers') as any).getParserByID = () => failingParser;

    const state = makeState();
    const store = { getState: () => state };
    const next = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const middleware = parserMiddleware(store)(next);
    await middleware({ type: 'INIT' });

    const errorCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT' && c[0]?.result?.error,
    );
    expect(errorCalls.length).toBeGreaterThan(0);
    expect(errorCalls[0][0].result.error.message).toBe('bad syntax');

    spy.mockRestore();
    (await import('astexplorer-parsers') as any).getParserByID = orig;
  });
});
