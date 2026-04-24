import {
  getTransformer,
  getTransformCode,
  getCode,
  getTransformCursor,
  showTransformer,
} from './selectors';
import type { TransformResult, Transformer, AppState, Action, SourceMapConsumer } from '../types';
import type { MiddlewareAPI, Dispatch } from 'redux';

function isSourceMapConsumer(value: unknown): value is SourceMapConsumer {
  return typeof value === 'object' && value !== null;
}

function isTreeGexTransformer(t: Transformer | undefined | null): boolean {
  return Boolean(t?.id?.startsWith('tree-gex'));
}

async function transform(
  transformer: Transformer,
  transformCode: string,
  code: string,
  cursor: number | null,
): Promise<TransformResult> {
  // Transforms may make use of Node's __filename global. See GitHub issue #420.
  // So we define a dummy one.
  globalThis.__filename ??= 'transform.js';
  transformer._promise ??= new Promise(transformer.loadTransformer);
  let realTransformerVersion: string | undefined;
  try {
    const resolved: unknown = await transformer._promise;
    if (
      resolved !== null &&
      resolved !== undefined &&
      typeof resolved === 'object' &&
      'version' in resolved
    ) {
      realTransformerVersion = String(resolved.version);
    }
    const maybeCursor = isTreeGexTransformer(transformer) && cursor !== null ? cursor : undefined;
    let result = await transformer.transform(resolved, transformCode, code, maybeCursor);
    let map: SourceMapConsumer | null = null;
    let cursorNodes: unknown[] | undefined;
    if (typeof result !== 'string') {
      if (isSourceMapConsumer(result.map)) {
        map = result.map;
      }
      if (Array.isArray((result as { cursorNodes?: unknown[] }).cursorNodes)) {
        cursorNodes = (result as { cursorNodes?: unknown[] }).cursorNodes;
      }
      result = result.code;
    }
    return { result, map, version: realTransformerVersion, error: null, cursorNodes };
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    return {
      error,
      version: realTransformerVersion ?? '',
    };
  }
}

export default (store: MiddlewareAPI<Dispatch, AppState>) =>
  (next: Dispatch) =>
  async (action: Action) => {
    const oldState = store.getState();
    next(action);
    const newState = store.getState();

    const show = showTransformer(newState);

    if (!show) {
      return;
    }

    const newTransformer = getTransformer(newState);
    const newTransformCode = getTransformCode(newState);
    const newCode = getCode(newState);
    const newCursor = getTransformCursor(newState);

    const treeGex = isTreeGexTransformer(newTransformer);
    const cursorChanged = treeGex && getTransformCursor(oldState) !== newCursor;

    if (
      action.type === 'INIT' ||
      show !== showTransformer(oldState) ||
      getTransformer(oldState) !== newTransformer ||
      getTransformCode(oldState) !== newTransformCode ||
      getCode(oldState) !== newCode ||
      cursorChanged
    ) {
      if (
        newTransformer === undefined ||
        newTransformer === null ||
        newCode === null ||
        newCode === undefined
      ) {
        return;
      }

      if (typeof console.clear === 'function') {
        console.clear();
      }

      next({ type: 'START_TRANSFORMING' });
      let result: TransformResult;
      try {
        result = await transform(newTransformer, newTransformCode, newCode, newCursor);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        result = { error };
      }

      // Did anything change in the meantime?
      if (
        newTransformer !== getTransformer(store.getState()) ||
        newTransformCode !== getTransformCode(store.getState()) ||
        newCode !== getCode(store.getState()) ||
        (treeGex && newCursor !== getTransformCursor(store.getState()))
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
