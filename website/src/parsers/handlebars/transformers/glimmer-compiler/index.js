import compileModule from '../../../utils/compileModule';
import pkg from '@glimmer/compiler/package.json';

const ID = 'glimmer-compiler';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  defaultParserID: 'glimmer',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/compiler')}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', '@glimmer/compiler'],
      (/** @type {{default: (code: string) => string}} */ transpile, /** @type {typeof import('@glimmer/compiler')} */ glimmer) => callback({ transpile: transpile.default, glimmer }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, glimmer: typeof import('@glimmer/compiler')}} */ { transpile, glimmer }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    const transformModule = compileModule(transformCode);

    // allow "export default" instead of "module.exports = "
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    // compile template to wireformat
    let result = glimmer.precompile(code, {
      plugins: {
        ast: [/** @type {import('@glimmer/syntax').ASTPluginBuilder} */ (/** @type {unknown} */ (transform))],
      },
    });

    // parse wireformat into JSON
    let json = /** @type {string} */ (JSON.parse(/** @type {string} */ (/** @type {{block: string}} */ (JSON.parse(result)).block)));

    // pretty print JSON
    return { code: /** @type {string} */ (json) };
  },
};
