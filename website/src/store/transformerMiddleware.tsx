import {getTransformer, getTransformCode, getCode, showTransformer} from './selectors';
import type {TransformResult, Transformer, AppState, Action, SourceMapConsumer} from '../types';
import type {MiddlewareAPI, Dispatch} from 'redux';

async function transform(transformer: Transformer, transformCode: string, code: string): Promise<TransformResult> {
  // Transforms may make use of Node's __filename global. See GitHub issue #420.
  // So we define a dummy one.
  globalThis.__filename ??= 'transform.js';
  transformer._promise ??= new Promise(transformer.loadTransformer);
  let realTransformerVersion: string | undefined;
  try {
    const resolved: unknown = await transformer._promise;
    if (resolved !== null && resolved !== undefined && typeof resolved === 'object' && 'version' in resolved) {
      realTransformerVersion = String(resolved.version);
    }
    let result = await transformer.transform(resolved, transformCode, code);
    let map: SourceMapConsumer | null = null;
    if (typeof result !== 'string') {
      if (result.map !== undefined && result.map !== null && typeof result.map === 'object') {
        map = result.map;
      }
      result = result.code;
    }
    return { result, map, version: realTransformerVersion, error: null };
  } catch(err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      error,
      version: realTransformerVersion ?? '',
    };
  }
}

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
    if (newTransformer === undefined || newTransformer === null || newCode === null || newCode === undefined) {
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
