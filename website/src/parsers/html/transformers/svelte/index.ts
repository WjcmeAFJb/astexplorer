import compileModule from '../../../utils/compileModule';
import pkg from 'svelte/package.json';

const ID = 'svelte';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://sveltejs/svelte',

  defaultParserID: 'svelte',

  loadTransformer(callback: (realTransformer: typeof import('svelte/compiler')) => void) {
    require(
      ['svelte/compiler'],
      callback,
    );
  },

  transform({ preprocess }: {preprocess: (source: string, preprocessor: object) => unknown}, transformCode: string, code: string) {
    /** @type {() => {markup?: (...args: unknown[]) => string, script?: (...args: unknown[]) => string, style?: (...args: unknown[]) => string}} */
    const transform = (compileModule(transformCode) as () => {markup?: (...args: unknown[]) => string, script?: (...args: unknown[]) => string, style?: (...args: unknown[]) => string});

    // Identity functions in case of missing transforms
    const _markupIdentity = (content: string, _filename: string) => content;
    const _scriptIdentity = (content: string, _attributes: Record<string, string | boolean>, _filename: string) => content;
    const _styleIdentity = (content: string, _attributes: Record<string, string | boolean>, _filename: string) => content;

    // Check if there is a transform
    // If Yes, set the appropriate transform or else use identity functions
    const markupTransform = transform().markup || _markupIdentity;
    const scriptTransform = transform().script || _scriptIdentity;
    const styleTransform = transform().style || _styleIdentity;

    const result = preprocess(code, {
      markup:({ content, _filename}: {content: string, _filename: string}) => {
        return {
          code: markupTransform(content),
        };
      },
      script: ({content, attributes, _filename}: {content: string, attributes: Record<string, string | boolean>, _filename: string}) => {
        return {
          code: scriptTransform(content, attributes),
        };
      },
      style: ({content, attributes, _filename}: {content: string, attributes: Record<string, string | boolean>, _filename: string}) => {
        return {
          code: styleTransform(content, attributes),
        };
      },
    });
    return result;
  },
}
