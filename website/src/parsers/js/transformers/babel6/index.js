import compileModule from '../../../utils/compileModule';
import pkg from 'babel6/package.json';

const ID = 'babelv6';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: false,

  defaultParserID: 'babylon6',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}}) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      'babel6',
      'recast',
    ], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{transform: (...args: unknown[]) => unknown}} */ babel, /** @type {{parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}} */ recast) => callback({ transpile: transpile.default, babel, recast }));
  },

  transform(/** @type {{transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}}} */ { transpile, babel, recast }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return babel.transform(code, {
      parserOpts: {
        parser: recast.parse,
        plugins: [
          'asyncGenerators',
          'classConstructorCall',
          'classProperties',
          'decorators',
          'doExpressions',
          'exportExtensions',
          'flow',
          'functionSent',
          'functionBind',
          'jsx',
          'objectRestSpread',
          'dynamicImport',
        ],
      },
      generatorOpts: {
        generator: recast.print,
      },
      plugins: [(transform.default || transform)(babel)],
      sourceMaps: true,
    });
  },
};
