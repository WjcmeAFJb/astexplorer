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
      loadParser: (cb: (p: unknown) => void) =>
        cb({ parse: (code: string) => ({ type: 'Program', body: [], code }) }),
      parse: (realParser: any, code: string) => realParser.parse(code),
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
      hasSettings: () => false,
    };
  }
  return parserCache[id];
}
vi.mock('astexplorer-parsers', () => ({
  getParserByID: (id: string) => (id ? getOrCreateParser(id) : undefined),
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
      parse: () => {
        throw new SyntaxError('bad syntax');
      },
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: () => '',
      *forEachProperty() {},
      getDefaultOptions: () => ({}),
    };

    const { getParserByID } = await import('astexplorer-parsers');
    const orig = getParserByID;
    ((await import('astexplorer-parsers')) as any).getParserByID = () => failingParser;

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
    ((await import('astexplorer-parsers')) as any).getParserByID = orig;
  });

  test('caches parser._promise across multiple parse calls', async () => {
    // This kills the mutant: if (!parser._promise) -> if (true)
    // If the promise is recreated every time, loadParser would be called multiple times
    const loadCount = { value: 0 };
    const cachingParser = {
      id: 'caching-test',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) => {
        loadCount.value++;
        cb({ parse: (code: string) => ({ type: 'Program', code }) });
      },
      parse: (realParser: any, code: string) => realParser.parse(code),
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    parserCache['caching-test'] = cachingParser;

    // First parse — loadParser called once
    const state1 = makeState();
    state1.workbench.parser = 'caching-test';
    const store1 = { getState: () => state1 };
    const next1 = vi.fn();
    await parserMiddleware(store1)(next1)({ type: 'INIT' });
    expect(loadCount.value).toBe(1);
    // Confirm _promise is now set
    expect(cachingParser._promise).toBeDefined();

    // Second parse — _promise is cached on the parser object, loadParser NOT called again
    const next2 = vi.fn();
    const state2 = makeState();
    state2.workbench.parser = 'caching-test';
    state2.workbench.code = 'const y = 2;';
    const store2 = { getState: () => state2 };
    await parserMiddleware(store2)(next2)({ type: 'INIT' });
    // If mutant changed to if(true), _promise would be recreated and loadCount would be 2
    expect(loadCount.value).toBe(1);
  });

  test('uses parserSettings when provided, not getDefaultOptions', async () => {
    // This kills mutants on line 17: parserSettings || parser.getDefaultOptions()
    const receivedSettings: any[] = [];
    const settingsParser = {
      id: 'settings-test',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) => cb({}),
      parse: (_realParser: any, code: string, settings: any) => {
        receivedSettings.push(settings);
        return { type: 'Program', code };
      },
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({ default: true }),
    };
    parserCache['settings-test'] = settingsParser;

    // Test with parserSettings = null -> should use getDefaultOptions
    const stateNoSettings = makeState();
    stateNoSettings.workbench.parser = 'settings-test';
    stateNoSettings.workbench.parserSettings = null;
    const store1 = { getState: () => stateNoSettings };
    const next1 = vi.fn();
    await parserMiddleware(store1)(next1)({ type: 'INIT' });
    expect(receivedSettings[0]).toEqual({ default: true });

    // Reset
    receivedSettings.length = 0;
    delete settingsParser._promise;

    // Test with parserSettings provided -> should use those, not defaults
    const stateWithSettings = makeState();
    stateWithSettings.workbench.parser = 'settings-test';
    stateWithSettings.workbench.parserSettings = { custom: 'value' } as any;
    const store2 = { getState: () => stateWithSettings };
    const next2 = vi.fn();
    await parserMiddleware(store2)(next2)({ type: 'INIT' });
    expect(receivedSettings[0]).toEqual({ custom: 'value' });
  });

  test('parses when parser changes between old and new state', async () => {
    // Kills mutant: getParser(oldState) !== newParser -> false
    const oldState = makeState();
    oldState.workbench.parser = 'acorn';
    const newState = makeState();
    newState.workbench.parser = 'acorn'; // same parser ID, but we'll make oldState have a different one

    // Create a different parser for old state
    parserCache['babel'] = {
      id: 'babel',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) =>
        cb({ parse: (code: string) => ({ type: 'Program', code }) }),
      parse: (realParser: any, code: string) => realParser.parse(code),
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    oldState.workbench.parser = 'babel';

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        return callCount === 1 ? oldState : newState;
      }),
    };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'SET_PARSER' });

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(1);
  });

  test('parses when parserSettings changes between old and new state', async () => {
    // Kills mutant: getParserSettings(oldState) !== newParserSettings -> false
    const oldState = makeState();
    oldState.workbench.parserSettings = { old: true } as any;
    const newState = makeState();
    newState.workbench.parserSettings = { new: true } as any;

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        return callCount === 1 ? oldState : newState;
      }),
    };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'SET_PARSER_SETTINGS' });

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(1);
  });

  test('parses when code changes between old and new state', async () => {
    // Kills mutant: getCode(oldState) !== newCode -> false
    const oldState = makeState();
    oldState.workbench.code = 'old code';
    const newState = makeState();
    newState.workbench.code = 'new code';

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        return callCount === 1 ? oldState : newState;
      }),
    };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'SET_CODE' });

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(1);
  });

  test('does not dispatch when parser changes during async parse', async () => {
    // Kills mutants on line 45: stale check for parser
    let resolveParse!: (v: any) => void;
    const parsePromise = new Promise((r) => {
      resolveParse = r;
    });
    const slowParser = {
      id: 'slow-parser',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) => cb({}),
      parse: () => parsePromise,
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    parserCache['slow-parser'] = slowParser;

    const initState = makeState();
    initState.workbench.parser = 'slow-parser';

    // After parse completes, state has a DIFFERENT parser
    const changedState = makeState();
    changedState.workbench.parser = 'acorn'; // different parser

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        if (callCount <= 2) return initState;
        return changedState; // parser changed during parse
      }),
    };
    const next = vi.fn();
    const promise = parserMiddleware(store)(next)({ type: 'INIT' });
    resolveParse({ type: 'AST' });
    await promise;

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(0);
  });

  test('does not dispatch when parserSettings changes during async parse', async () => {
    // Kills stale check mutants for parserSettings (line 46)
    let resolveParse!: (v: any) => void;
    const parsePromise = new Promise((r) => {
      resolveParse = r;
    });
    const slowParser2 = {
      id: 'slow-parser-2',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) => cb({}),
      parse: () => parsePromise,
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    parserCache['slow-parser-2'] = slowParser2;

    const initState = makeState();
    initState.workbench.parser = 'slow-parser-2';
    initState.workbench.parserSettings = { v: 1 } as any;

    // After parse, parserSettings changed
    const changedState = makeState();
    changedState.workbench.parser = 'slow-parser-2';
    changedState.workbench.parserSettings = { v: 2 } as any;

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        if (callCount <= 2) return initState;
        return changedState;
      }),
    };
    const next = vi.fn();
    const promise = parserMiddleware(store)(next)({ type: 'INIT' });
    resolveParse({ type: 'AST' });
    await promise;

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(0);
  });

  test('does not dispatch when code changes during async parse', async () => {
    // Kills stale check mutants for code (line 47)
    let resolveParse!: (v: any) => void;
    const parsePromise = new Promise((r) => {
      resolveParse = r;
    });
    const slowParser3 = {
      id: 'slow-parser-3',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      loadParser: (cb: (p: unknown) => void) => cb({}),
      parse: () => parsePromise,
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    parserCache['slow-parser-3'] = slowParser3;

    const initState = makeState();
    initState.workbench.parser = 'slow-parser-3';

    // After parse, code changed
    const changedState = makeState();
    changedState.workbench.parser = 'slow-parser-3';
    changedState.workbench.code = 'different code now';

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        if (callCount <= 2) return initState;
        return changedState;
      }),
    };
    const next = vi.fn();
    const promise = parserMiddleware(store)(next)({ type: 'INIT' });
    resolveParse({ type: 'AST' });
    await promise;

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults.length).toBe(0);
  });

  test('dispatched SET_PARSE_RESULT has exact treeAdapter shape', async () => {
    // Kills ObjectLiteral/StringLiteral mutants for treeAdapter (lines 52-54, 63)
    const state = makeState();
    const store = { getState: () => state };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const parseResultCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT',
    );
    expect(parseResultCalls.length).toBe(1);
    const result = parseResultCalls[0][0].result;
    const ta = result.treeAdapter;

    // Verify exact treeAdapter structure
    expect(ta.type).toBe('default');
    expect(ta).toHaveProperty('type');
    expect(ta).toHaveProperty('options');
    expect(ta.options).toHaveProperty('openByDefault');
    expect(ta.options).toHaveProperty('nodeToRange');
    expect(ta.options).toHaveProperty('nodeToName');
    expect(ta.options).toHaveProperty('walkNode');
    expect(ta.options).toHaveProperty('filters');
    expect(ta.options).toHaveProperty('locationProps');

    // Verify filters is a non-empty array (kills ArrayDeclaration mutation -> [])
    expect(Array.isArray(ta.options.filters)).toBe(true);
    expect(ta.options.filters.length).toBe(5);

    // Verify openByDefault is a function that works (kills || -> && mutant)
    expect(typeof ta.options.openByDefault).toBe('function');

    // Verify time is reasonable (kills ArithmeticOperator: - -> +)
    expect(result.time).toBeGreaterThanOrEqual(0);
    expect(result.time).toBeLessThan(5000); // should complete in < 5s
  });

  test('treeAdapter.type is exactly "default" string', async () => {
    // Kills StringLiteral mutant: type: 'default' -> type: ""
    const state = makeState();
    const store = { getState: () => state };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const parseResultCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT',
    );
    const ta = parseResultCalls[0][0].result.treeAdapter;
    expect(ta.type).toBe('default');
    expect(ta.type.length).toBeGreaterThan(0);
  });

  test('error result has exact shape with null time, ast, and treeAdapter', async () => {
    // Verify exact error result shape
    const failingParser = {
      id: 'exact-error',
      _ignoredProperties: new Set(),
      locationProps: new Set(),
      typeProps: new Set(['type']),
      loadParser: (cb: any) => cb({}),
      parse: () => {
        throw new Error('parse error');
      },
      opensByDefault: () => false,
      nodeToRange: () => null,
      getNodeName: () => '',
      *forEachProperty() {},
      getDefaultOptions: () => ({}),
    };
    parserCache['exact-error'] = failingParser;

    const state = makeState();
    state.workbench.parser = 'exact-error';
    const store = { getState: () => state };
    const next = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const errorCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(errorCalls.length).toBe(1);
    const result = errorCalls[0][0].result;
    expect(result).toEqual({
      time: null,
      ast: null,
      treeAdapter: null,
      error: expect.any(Error),
    });
    spy.mockRestore();
  });

  test('does not parse when parser is null/undefined', async () => {
    // Kills mutant: if (!newParser || newCode == null) -- tests the !newParser branch
    const state = makeState();
    state.workbench.parser = '' as any; // getParserByID('') returns undefined
    const store = { getState: () => state };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const parseResults = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_PARSE_RESULT');
    expect(parseResults).toHaveLength(0);
  });

  test('opensByDefault fallback works when parser does not define it', async () => {
    // Kills LogicalOperator mutant: opensByDefault || (() => false) -> opensByDefault && (() => false)
    const noOpenParser = {
      id: 'no-open',
      _ignoredProperties: new Set(),
      locationProps: new Set(['loc']),
      typeProps: new Set(['type']),
      opensByDefault: undefined, // falsy — should fallback to () => false
      loadParser: (cb: (p: unknown) => void) =>
        cb({ parse: (code: string) => ({ type: 'Program', code }) }),
      parse: (realParser: any, code: string) => realParser.parse(code),
      nodeToRange: () => null,
      getNodeName: (n: any) => n?.type,
      *forEachProperty(n: any) {
        if (n) for (const k of Object.keys(n)) yield { value: n[k], key: k, computed: false };
      },
      getDefaultOptions: () => ({}),
    };
    parserCache['no-open'] = noOpenParser;

    const state = makeState();
    state.workbench.parser = 'no-open';
    const store = { getState: () => state };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const parseResultCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT',
    );
    expect(parseResultCalls.length).toBe(1);
    const ta = parseResultCalls[0][0].result.treeAdapter;
    // If || was mutated to &&, openByDefault would be falsy/undefined, not a function
    expect(typeof ta.options.openByDefault).toBe('function');
    // And calling it should return false, not throw
    expect(ta.options.openByDefault({})).toBe(false);
  });

  test('time is calculated as difference, not sum', async () => {
    // Kills ArithmeticOperator mutant: Date.now() - start -> Date.now() + start
    const state = makeState();
    const store = { getState: () => state };
    const next = vi.fn();
    await parserMiddleware(store)(next)({ type: 'INIT' });

    const parseResultCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_PARSE_RESULT',
    );
    const time = parseResultCalls[0][0].result.time;
    // Date.now() + start would give a huge number (>= 2 * Date.now() which is billions)
    // Date.now() - start should be a small number (< 1000ms for a fast parse)
    expect(time).toBeLessThan(1000);
    expect(time).toBeGreaterThanOrEqual(0);
  });
});
