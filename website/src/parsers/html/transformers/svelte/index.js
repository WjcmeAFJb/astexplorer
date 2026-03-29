import compileModule from '../../../utils/compileModule';
import pkg from 'svelte/package.json';

const ID = 'svelte';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://sveltejs/svelte',

  defaultParserID: 'svelte',

  loadTransformer(/** @type {*} */ callback) {
    require(
      ['svelte/compiler'],
      callback,
    );
  },

  transform(/** @type {*} */ { preprocess }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    /** @type {function(): {markup?: Function, script?: Function, style?: Function}} */
    const transform = compileModule(transformCode);

    // Identity functions in case of missing transforms
    const _markupIdentity = (/** @type {*} */ content, /** @type {*} */ _filename) => content;
    const _scriptIdentity = (/** @type {*} */ content, /** @type {*} */ _attributes, /** @type {*} */ _filename) => content;
    const _styleIdentity = (/** @type {*} */ content, /** @type {*} */ _attributes, /** @type {*} */ _filename) => content;

    // Check if there is a transform
    // If Yes, set the appropriate transform or else use identity functions
    const markupTransform = transform().markup || _markupIdentity;
    const scriptTransform = transform().script || _scriptIdentity;
    const styleTransform = transform().style || _styleIdentity;

    const result = preprocess(code, {
      markup:(/** @type {*} */ { content, _filename}) => {
        return {
          code: markupTransform(content),
        };
      },
      script: (/** @type {*} */ {content, attributes, _filename}) => {
        return {
          code: scriptTransform(content, attributes),
        };
      },
      style: (/** @type {*} */ {content, attributes, _filename}) => {
        return {
          code: styleTransform(content, attributes),
        };
      },
    });
    return result;
  },
}
