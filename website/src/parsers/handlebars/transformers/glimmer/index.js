import compileModule from '../../../utils/compileModule';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  defaultParserID: 'glimmer',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/syntax')}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', '@glimmer/syntax'],
      (/** @type {{default: (code: string) => string}} */ transpile, /** @type {typeof import('@glimmer/syntax')} */ glimmer) => callback({ transpile: transpile.default, glimmer }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, glimmer: typeof import('@glimmer/syntax')}} */ { transpile, glimmer }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    const transformModule = compileModule(transformCode);

    // allow "export default" instead of "module.exports = "
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    let ast = glimmer.preprocess(code, {
      plugins: {
        ast: [/** @type {import('@glimmer/syntax').ASTPluginBuilder} */ (transform)],
      },
    });

    return glimmer.print(ast);
  },
};
