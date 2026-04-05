// oxlint-disable max-lines-per-function, typescript-eslint/no-unsafe-argument, typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- middleware functions are necessarily large state-coordination units; legacy untyped code
import {getTransformer, getTransformCode, getCode, showTransformer} from './selectors';
import {SourceMapConsumer} from 'source-map/lib/source-map-consumer';
import type {TransformResult, Transformer} from '../types';

async function transform(transformer: Transformer, transformCode: string, code: string): Promise<TransformResult> {
  // Transforms may make use of Node's __filename global. See GitHub issue #420.
  // So we define a dummy one.
  if (!globalThis.__filename) {
    globalThis.__filename = 'transform.js';
  }
  if (!transformer._promise) {
    transformer._promise = new Promise(transformer.loadTransformer);
  }
  let realTransformer: {version?: string, [key: string]: unknown} | undefined;
  try {
    // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- transformer._promise resolves to an untyped third-party module
    realTransformer = await transformer._promise as any;
    let result = await transformer.transform(realTransformer, transformCode, code);
    // oxlint-disable-next-line unicorn/no-null -- TransformResult.map is typed as SourceMapConsumer | null
    let map = null;
    if (typeof result !== 'string') {
      if (result.map) {
        map = new SourceMapConsumer(result.map);
      }
      result = result.code;
    }
    // oxlint-disable-next-line unicorn/no-null -- TransformResult.error is typed as Error | null; null means "no error"
    return { result, map, version: realTransformer.version, error: null };
  } catch(error) {
    return {
      error: (error as Error),
      version: realTransformer ? realTransformer.version : '',
    };
  }
}

export default (store: any) => (next: any) => async (action: any) => { // oxlint-disable-line typescript-eslint(no-explicit-any) -- Redux middleware signature requires any for store/next/action compatibility
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
    if (!newTransformer || newCode === null || newCode === undefined) {
      return;
    }

    if (console.clear) {
      console.clear();
    }

        let result: TransformResult;
    try  {
      result = await transform(newTransformer, newTransformCode, newCode);
    } catch (error) {
      result = {error: (error as Error)}
    }

    // Did anything change in the meantime?
    if (
      newTransformer !== getTransformer(store.getState()) ||
      newTransformCode !== getTransformCode(store.getState()) ||
      newCode !== getCode(store.getState())
    ) {
      return;
    }

    if (result.error) {
      console.error(result.error); // eslint-disable-line no-console
    }
    next({
      type: 'SET_TRANSFORM_RESULT',
      result,
    });
  }
};
