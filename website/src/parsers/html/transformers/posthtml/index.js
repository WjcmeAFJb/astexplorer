import compileModule from '../../../utils/compileModule';
import pkg from 'posthtml/package.json';

const ID = 'posthtml';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/posthtml/posthtml',

  defaultParserID: 'posthtml-parser',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, posthtml: typeof import('posthtml')}) => void} */ callback) {
    require(['../../../transpilers/babel', 'posthtml'], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {typeof import('posthtml')} */ posthtml) =>
      callback({ transpile: transpile.default, posthtml }));
  },

  transform(/** @type {{transpile: (code: string) => string, posthtml: typeof import('posthtml')}} */ { transpile, posthtml }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    // transpile with babel for es6+ support
    transformCode = transpile(transformCode);
    // compile to turn from string into a module
    let transform = compileModule(
      // eslint-disable-line no-shadow
      transformCode,
    );
    return (/** @type {import('posthtml').Result<unknown>} */ (/** @type {unknown} */ (posthtml()
      .use(transform.default || transform)
      .process(code, { sync: true })))).html;
  },
};
