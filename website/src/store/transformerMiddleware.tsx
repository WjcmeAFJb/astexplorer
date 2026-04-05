import {getTransformer, getTransformCode, getCode, showTransformer} from './selectors';
import {SourceMapConsumer} from 'source-map/lib/source-map-consumer';
import type {TransformResult, Transformer, AppState, Action} from '../types';
import type {MiddlewareAPI, Dispatch} from 'redux';

async function transform(transformer: Transformer, transformCode: string, code: string): Promise<TransformResult> {
  // Transforms may make use of Node's __filename global. See GitHub issue #420.
  // So we define a dummy one.
  globalThis.__filename ??= 'transform.js';
  transformer._promise ??= new Promise(transformer.loadTransformer);
  let realTransformer: {version?: string, [key: string]: unknown} | undefined;
  try {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- transformer._promise resolves to an untyped third-party module
    realTransformer = await transformer._promise as {version?: string, [key: string]: unknown};
    let result = await transformer.transform(realTransformer, transformCode, code);
    // oxlint-disable-next-line unicorn/no-null -- TransformResult.map is typed as SourceMapConsumer | null
    let map = null;
    if (typeof result !== 'string') {
      if (result.map !== undefined && result.map !== null) {
        map = new SourceMapConsumer(result.map);
      }
      result = result.code;
    }
    // oxlint-disable-next-line unicorn/no-null -- TransformResult.error is typed as Error | null; null means "no error"
    return { result, map, version: realTransformer.version, error: null };
  } catch(err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      error,
      version: realTransformer === undefined ? '' : realTransformer.version,
    };
  }
}

// oxlint-disable-next-line max-lines-per-function -- Redux middleware orchestrates multiple async operations
export default (store: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => async (action: Action) => {
  const oldState = store.getState();
  next(action);
  const newState = store.getState();

  const show = showTransformer(newState);

  if (!show) {
    return
  }

  const newTransformer = getTransformer(newState);
  const newTransformCode = getTransformCode(newState);
  const newCode = getCode(newState);

  if (
    action.type === 'INIT' ||
    show !== showTransformer(oldState) ||
    getTransformer(oldState) !== newTransformer ||
    getTransformCode(oldState) !== newTransformCode ||
    getCode(oldState) !== newCode
  ) {
    // oxlint-disable-next-line typescript-eslint(strict-boolean-expressions) -- runtime guard: transformer/code may be null at runtime despite types (e.g. rehydrated from storage)
    if (!newTransformer || newCode === null || newCode === undefined) {
      return;
    }

    if (typeof console.clear === 'function') {
      console.clear();
    }

        let result: TransformResult;
    try  {
      result = await transform(newTransformer, newTransformCode, newCode);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      result = {error}
    }

    // Did anything change in the meantime?
    if (
      newTransformer !== getTransformer(store.getState()) ||
      newTransformCode !== getTransformCode(store.getState()) ||
      newCode !== getCode(store.getState())
    ) {
      return;
    }

    if (result.error !== undefined && result.error !== null) {
      console.error(result.error); // eslint-disable-line no-console
    }
    next({
      type: 'SET_TRANSFORM_RESULT',
      result,
    });
  }
};
