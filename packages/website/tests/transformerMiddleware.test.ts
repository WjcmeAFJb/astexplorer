/**
 * @vitest-environment happy-dom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock source-map
vi.mock('source-map/lib/source-map-consumer', () => ({
  SourceMapConsumer: vi.fn().mockImplementation((map: unknown) => ({ map })),
}));

const { transformerCache } = vi.hoisted(() => {
  return { transformerCache: new Map() };
});

vi.mock('astexplorer-parsers', () => {
  return {
    getParserByID: (id: string) => ({ id }),
    getTransformerByID: (id: string) => {
      if (!id) return undefined;
      if (!transformerCache.has(id)) {
        transformerCache.set(id, {
          id,
          version: '1.0',
          loadTransformer: (resolve: (value: unknown) => void) => resolve({ version: '1.0' }),
          transform: vi.fn().mockResolvedValue('transformed code'),
        });
      }
      return transformerCache.get(id);
    },
  };
});

import transformerMiddleware from '../src/store/transformerMiddleware';

function makeState(overrides: Record<string, any> = {}) {
  return {
    workbench: {
      parser: 'acorn',
      parserSettings: null,
      code: 'const x = 1;',
      initialCode: 'const x = 1;',
      keyMap: 'default',
      parseResult: undefined,
      transform: {
        transformer: 'jscodeshift',
        code: 'export default function(fileInfo) {}',
        initialCode: '',
        transformResult: null,
      },
    },
    showTransformPanel: true,
    activeRevision: null,
    enableFormatting: false,
    ...overrides,
  };
}

describe('transformerMiddleware', () => {
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    next = vi.fn();
    // Re-establish default transform implementation after clearAllMocks
    for (const [, transformer] of transformerCache) {
      // Clear the cached _promise so loadTransformer is called fresh
      delete transformer._promise;
      transformer.transform.mockResolvedValue('transformed code');
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'clear').mockImplementation(() => {});
  });

  test('always calls next(action) to forward the action', async () => {
    const oldState = makeState({ showTransformPanel: false });
    const newState = makeState({ showTransformPanel: false });
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SOME_ACTION' });

    expect(next).toHaveBeenCalledWith({ type: 'SOME_ACTION' });
  });

  test('returns early when showTransformer is false', async () => {
    const state = makeState({ showTransformPanel: false });
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SET_CODE' });

    // Only the forwarded action, no SET_TRANSFORM_RESULT
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('runs transform on INIT action', async () => {
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.result).toBe('transformed code');
    expect(transformCalls[0][0].result.error).toBeNull();
  });

  test('runs transform when showTransformer changes', async () => {
    const oldState = makeState({ showTransformPanel: false });
    const newState = makeState({ showTransformPanel: true });
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SELECT_TRANSFORMER' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
  });

  test('runs transform when code changes', async () => {
    const oldState = makeState();
    const newState = makeState();
    newState.workbench.code = 'const y = 2;';
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SET_CODE' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
  });

  test('runs transform when transformCode changes', async () => {
    const oldState = makeState();
    const newState = makeState();
    newState.workbench.transform.code = 'new transform code';
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SET_TRANSFORM' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
  });

  test('does not run transform when nothing relevant changes', async () => {
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'OPEN_SETTINGS_DIALOG' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('returns early when transformer is null', async () => {
    const state = makeState();
    state.workbench.transform.transformer = '';
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('returns early when code is null', async () => {
    const state = makeState();
    state.workbench.code = null as any;
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('handles transform error', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockRejectedValueOnce(new Error('Transform failed'));

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.error).toBeTruthy();
  });

  test('handles transform returning object with code and map', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockResolvedValueOnce({
      code: 'output code',
      map: { version: 3, sources: [], mappings: '' },
    });

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.result).toBe('output code');
    expect(transformCalls[0][0].result.map).toBeTruthy();
  });

  test('handles transform returning object without map', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockResolvedValueOnce({
      code: 'output code',
    });

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.result).toBe('output code');
    expect(transformCalls[0][0].result.map).toBeNull();
  });

  test('calls console.clear before transforming', async () => {
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    expect(console.clear).toHaveBeenCalled();
  });

  test('logs error to console when transform result has error', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    const error = new Error('Transform crashed');
    transformer.transform.mockRejectedValueOnce(error);

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    expect(console.error).toHaveBeenCalled();
  });

  test('does not dispatch result if state changed during transform', async () => {
    let resolveTransform: (v: any) => void;
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockReturnValueOnce(new Promise((r) => (resolveTransform = r)));

    const state1 = makeState();
    const state2 = makeState();
    state2.workbench.code = 'changed code';

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        // First call: oldState (before next), second: newState (after next)
        // Third+: changed state (during transform check)
        if (callCount <= 2) return state1;
        return state2;
      }),
    };
    const middleware = transformerMiddleware(store)(next);

    const promise = middleware({ type: 'INIT' });
    resolveTransform!('result');
    await promise;

    // Should NOT dispatch SET_TRANSFORM_RESULT because code changed
    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('catches errors thrown during transform execution', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    const thrownError = new Error('Critical failure');
    transformer.transform.mockImplementationOnce(() => {
      throw thrownError;
    });

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.error).toBeTruthy();
  });

  test('runs transform when transformer changes', async () => {
    // oldState has a different transformer reference from newState
    const oldState = makeState();
    oldState.workbench.transform.transformer = 'babel';
    const newState = makeState();
    newState.workbench.transform.transformer = 'jscodeshift';

    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SELECT_TRANSFORMER' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
  });

  test('sets globalThis.__filename to transform.js when not defined', async () => {
    // Kills mutants on lines 11-12: __filename guard and string value
    const origFilename = globalThis.__filename;
    delete (globalThis as any).__filename;

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);
    await middleware({ type: 'INIT' });

    expect(globalThis.__filename).toBe('transform.js');
    // Restore
    if (origFilename !== undefined) {
      globalThis.__filename = origFilename;
    } else {
      delete (globalThis as any).__filename;
    }
  });

  test('does not overwrite globalThis.__filename when already set', async () => {
    // Kills BooleanLiteral mutant: if (!globalThis.__filename) -> if (globalThis.__filename)
    const origFilename = globalThis.__filename;
    globalThis.__filename = 'already-set.js';

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);
    await middleware({ type: 'INIT' });

    expect(globalThis.__filename).toBe('already-set.js');
    // Restore
    if (origFilename !== undefined) {
      globalThis.__filename = origFilename;
    } else {
      delete (globalThis as any).__filename;
    }
  });

  test('caches transformer._promise across multiple transform calls', async () => {
    // Kills mutant: if (!transformer._promise) -> if (true)
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    let loadCount = 0;
    const origLoad = transformer.loadTransformer;
    transformer.loadTransformer = (resolve: (value: unknown) => void) => {
      loadCount++;
      resolve({ version: '1.0' });
    };
    delete transformer._promise; // clear any cached promise

    const state1 = makeState();
    const store1 = { getState: () => state1 };
    await transformerMiddleware(store1)(next)({ type: 'INIT' });
    expect(loadCount).toBe(1);

    // Second call — _promise should be cached
    const state2 = makeState();
    state2.workbench.code = 'const z = 3;';
    const next2 = vi.fn();
    const store2 = { getState: () => state2 };
    await transformerMiddleware(store2)(next2)({ type: 'INIT' });
    // loadTransformer should still only have been called once
    expect(loadCount).toBe(1);

    transformer.loadTransformer = origLoad;
  });

  test('returns early and does not dispatch when show is false (exact early return)', async () => {
    // Kills mutants: if (!show) -> if (false) and BlockStatement removal
    // We need to confirm that with show=false, NOTHING happens after next(action)
    const state = makeState({ showTransformPanel: false });
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    // Only the forwarded action, nothing else
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith({ type: 'INIT' });
    // console.clear should NOT have been called (it's after the show check)
    expect(console.clear).not.toHaveBeenCalled();
  });

  test('calls console.clear even when console.clear is truthy', async () => {
    // Kills mutant: if (console.clear) -> if (true)
    // This is already killed if console.clear exists. Let's verify it's called exactly.
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    expect(console.clear).toHaveBeenCalledTimes(1);
  });

  test('does not dispatch when transformer changes during async transform', async () => {
    // Kills mutant on line 76: newTransformer !== getTransformer(store.getState()) -> false
    let resolveTransform: (v: any) => void;
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockReturnValueOnce(new Promise((r) => (resolveTransform = r)));

    const state1 = makeState();
    const state2 = makeState();
    state2.workbench.transform.transformer = 'babel'; // different transformer

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        if (callCount <= 2) return state1;
        return state2; // transformer changed
      }),
    };
    const middleware = transformerMiddleware(store)(next);
    const promise = middleware({ type: 'INIT' });
    resolveTransform!('result');
    await promise;

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('does not dispatch when transformCode changes during async transform', async () => {
    // Kills mutant on line 77: newTransformCode !== getTransformCode(store.getState()) -> false
    let resolveTransform: (v: any) => void;
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockReturnValueOnce(new Promise((r) => (resolveTransform = r)));

    const state1 = makeState();
    const state2 = makeState();
    state2.workbench.transform.code = 'changed transform code'; // different transformCode

    let callCount = 0;
    const store = {
      getState: vi.fn(() => {
        callCount++;
        if (callCount <= 2) return state1;
        return state2; // transformCode changed
      }),
    };
    const middleware = transformerMiddleware(store)(next);
    const promise = middleware({ type: 'INIT' });
    resolveTransform!('result');
    await promise;

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(0);
  });

  test('console.error is called only when result has error, not always', async () => {
    // Kills mutant: if (result.error) -> if (true)
    // When there is NO error, console.error should NOT be called
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    transformer.transform.mockResolvedValueOnce('success result');

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    // console.error should NOT have been called for a successful transform
    expect(console.error).not.toHaveBeenCalled();
  });

  test('dispatched result has exact shape for successful string transform', async () => {
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    const dispatched = transformCalls[0][0];
    expect(dispatched).toEqual({
      type: 'SET_TRANSFORM_RESULT',
      result: {
        result: 'transformed code',
        map: null,
        version: '1.0',
        error: null,
      },
    });
  });

  test('dispatched result has exact shape for error transform', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    const error = new Error('Specific failure');
    transformer.transform.mockRejectedValueOnce(error);

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    const result = transformCalls[0][0].result;
    // The inner transform function catches the error and returns {error, version}
    expect(result.error).toBe(error);
    expect(result.version).toBe('1.0');
  });

  test('does not throw when console.clear is undefined', async () => {
    // Kills mutant: if (console.clear) -> if (true)
    // When console.clear is falsy, it should not call it (no TypeError)
    const origClear = console.clear;
    (console as any).clear = undefined;

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    // Should not throw even though console.clear is undefined
    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);

    // Restore
    console.clear = origClear;
  });

  test('handles error when loadTransformer rejects (realTransformer undefined)', async () => {
    // Kills NoCoverage mutant on line 32: version fallback when realTransformer is undefined
    const failingTransformerID = 'failing-load';
    transformerCache.set(failingTransformerID, {
      id: failingTransformerID,
      loadTransformer: (_resolve: any, reject: (reason: Error) => void) =>
        reject(new Error('load failed')),
      transform: vi.fn(),
    });

    const state = makeState();
    state.workbench.transform.transformer = failingTransformerID;
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    const result = transformCalls[0][0].result;
    expect(result.error).toBeTruthy();
    // When realTransformer is undefined, version should be '' (empty string)
    expect(result.version).toBe('');
  });

  test('catches errors thrown by the outer transform call', async () => {
    // Kills NoCoverage mutants on lines 70-71: the outer catch block
    // This path is hit when transform() throws before its internal try-catch.
    // Setting loadTransformer to a non-function causes new Promise() to throw
    // a TypeError before the internal try-catch is reached.
    const outerFailID = 'outer-fail';
    transformerCache.set(outerFailID, {
      id: outerFailID,
      // loadTransformer is not a function — new Promise(null) throws TypeError
      loadTransformer: null as any,
      transform: vi.fn(),
    });

    const state = makeState();
    state.workbench.transform.transformer = outerFailID;
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter(
      (c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT',
    );
    expect(transformCalls.length).toBe(1);
    expect(transformCalls[0][0].result.error).toBeInstanceOf(TypeError);
  });
});
