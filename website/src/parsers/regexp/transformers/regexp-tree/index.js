import compileModule from '../../../utils/compileModule';
import pkg from 'regexp-tree/package.json';

const ID = 'regexp-tree';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: ID,

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, regexpTree: typeof import('regexp-tree')}) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      'regexp-tree',
    ], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {typeof import('regexp-tree')} */ regexpTree) => callback({ transpile: transpile.default, regexpTree }));
  },

  transform(/** @type {{transpile: (code: string) => string, regexpTree: typeof import('regexp-tree')}} */ { transpile, regexpTree }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let handler = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return regexpTree.transform(code, /** @type {import('regexp-tree').TransformHandlers} */ (handler)).toString();
  },
};
