import compileModule from '../../../utils/compileModule';
import pkg from 'babel7/package.json';

const ID = 'babelv7';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babylon7',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, babel: {transformAsync: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}}) => void) {
    require([
      '../../../transpilers/babel',
      'babel7',
      'recast',
    ], (transpile: {default: (code: string) => string}, babel: {transformAsync: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}) => callback({ transpile: transpile.default, babel, recast }));
  },

  transform({ transpile, babel, recast }: {transpile: (code: string) => string, babel: {transformAsync: (...args: unknown[]) => unknown}, recast: {parse: (...args: unknown[]) => unknown, print: (...args: unknown[]) => unknown}}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return babel.transformAsync(code, {
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
      retainLines: false,
      generatorOpts: {
        generator: recast.print,
      },
      plugins: [(transform.default || transform)(babel)],
      sourceMaps: true,
    });
  },
};
