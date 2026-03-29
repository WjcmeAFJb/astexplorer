import compileModule from '../../../utils/compileModule';
import pkg from 'babel-plugin-macros/package';

const ID = 'babel-plugin-macros';
export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babylon7',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}, macro: {(babel: object, options: object): unknown, createMacro: (...args: unknown[]) => unknown, MacroError: (...args: unknown[]) => unknown}}) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      'babel7',
      'recast',
      'babel-plugin-macros',
    ], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{transform: (...args: unknown[]) => unknown}} */ babel, /** @type {{parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}} */ recast, /** @type {{(babel: object, options: object): unknown, createMacro: (...args: unknown[]) => unknown, MacroError: (...args: unknown[]) => unknown}} */ macro) => callback({ transpile: transpile.default, babel, recast, macro}));
  },

  transform(/** @type {{transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}, macro: {(babel: object, options: object): unknown, createMacro: (...args: unknown[]) => unknown, MacroError: (...args: unknown[]) => unknown}}} */ { transpile, babel, recast, macro}, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {createMacro: macro.createMacro, MacroError: macro.MacroError},
    );

    return babel.transform(code, {
      parserOpts: {
        parser: recast.parse,
        plugins: [
          'asyncGenerators',
          'bigInt',
          'classPrivateMethods',
          'classPrivateProperties',
          'classProperties',
          ['decorators', {decoratorsBeforeExport: false}],
          'doExpressions',
          'dynamicImport',
          'exportDefaultFrom',
          'exportNamespaceFrom',
          'flow',
          'flowComments',
          'functionBind',
          'functionSent',
          'importMeta',
          'jsx',
          'logicalAssignment',
          'nullishCoalescingOperator',
          'numericSeparator',
          'objectRestSpread',
          'optionalCatchBinding',
          'optionalChaining',
          ['pipelineOperator', {proposal: 'minimal'}],
          'throwExpressions',
        ],
      },
      generatorOpts: {
        generator: recast.print,
      },
      plugins: [macro(babel, {require: () => transform, resolvePath: (/** @type {string} */ src) => src})],
      sourceMaps: true,
    });
  },
};
