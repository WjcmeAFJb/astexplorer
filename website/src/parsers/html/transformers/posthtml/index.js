import compileModule from '../../../utils/compileModule';
import pkg from 'posthtml/package.json';

const ID = 'posthtml';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/posthtml/posthtml',

  defaultParserID: 'posthtml-parser',

  loadTransformer(/** @type {(realTransformer: Record<string, any>) => void} */ callback) {
    require(['../../../transpilers/babel', 'posthtml'], (/** @type {any} */ transpile, /** @type {any} */ posthtml) =>
      callback({ transpile: transpile.default, posthtml }));
  },

  transform(/** @type {Record<string, any>} */ { transpile, posthtml }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    // transpile with babel for es6+ support
    transformCode = transpile(transformCode);
    // compile to turn from string into a module
    let transform = compileModule(
      // eslint-disable-line no-shadow
      transformCode,
    );
    return posthtml()
      .use(transform.default || transform)
      .process(code, { sync: true }).html;
  },
};
