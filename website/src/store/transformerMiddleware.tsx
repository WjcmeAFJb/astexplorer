// oxlint-disable max-lines-per-function -- middleware functions are necessarily large state-coordination units
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
    realTransformer = await transformer._promise as any;
    let result = await transformer.transform(realTransformer, transformCode, code);
    let map = null;
    if (typeof result !== 'string') {
      if (result.map) {
        map = new SourceMapConsumer(result.map);
      }
      result = result.code;
    }
    return { result, map, version: realTransformer.version, error: null };
  } catch(error) {
    return {
      error: (error as Error),
      version: realTransformer ? realTransformer.version : '',
    };
  }
}

export default (store: any) => (next: any) => async (action: any) => {
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
