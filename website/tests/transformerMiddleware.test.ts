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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(1);
  });

  test('runs transform when code changes', async () => {
    const oldState = makeState();
    const newState = makeState();
    newState.workbench.code = 'const y = 2;';
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SET_CODE' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(1);
  });

  test('runs transform when transformCode changes', async () => {
    const oldState = makeState();
    const newState = makeState();
    newState.workbench.transform.code = 'new transform code';
    const store = { getState: vi.fn().mockReturnValueOnce(oldState).mockReturnValue(newState) };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'SET_TRANSFORM' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(1);
  });

  test('does not run transform when nothing relevant changes', async () => {
    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'OPEN_SETTINGS_DIALOG' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(0);
  });

  test('returns early when transformer is null', async () => {
    const state = makeState();
    state.workbench.transform.transformer = '';
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(0);
  });

  test('returns early when code is null', async () => {
    const state = makeState();
    state.workbench.code = null as any;
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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
    transformer.transform.mockReturnValueOnce(
      new Promise(r => resolveTransform = r),
    );

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
    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(0);
  });

  test('catches errors thrown during transform execution', async () => {
    const { getTransformerByID } = await import('astexplorer-parsers');
    const transformer = getTransformerByID('jscodeshift') as any;
    const thrownError = new Error('Critical failure');
    transformer.transform.mockImplementationOnce(() => { throw thrownError; });

    const state = makeState();
    const store = { getState: () => state };
    const middleware = transformerMiddleware(store)(next);

    await middleware({ type: 'INIT' });

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
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

    const transformCalls = next.mock.calls.filter((c: any[]) => c[0]?.type === 'SET_TRANSFORM_RESULT');
    expect(transformCalls.length).toBe(1);
  });
});
