import compileModule from '../../../utils/compileModule';
import pkg from 'regexp-tree/package.json';

const ID = 'regexp-tree';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: ID,

  loadTransformer(/** @type {(realTransformer: Record<string, Function>) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      'regexp-tree',
    ], (transpile, regexpTree) => callback({ transpile: transpile.default, regexpTree }));
  },

  transform(/** @type {Record<string, Function>} */ { transpile, regexpTree }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let handler = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return regexpTree.transform(code, handler).toString();
  },
};
