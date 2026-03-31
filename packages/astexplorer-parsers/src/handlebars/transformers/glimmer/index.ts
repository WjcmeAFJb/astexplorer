import compileModule from '../../../utils/compileModule';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  defaultParserID: 'glimmer',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/syntax')}) => void) {
    require(
      ['../../../transpilers/babel', '@glimmer/syntax'],
      (transpile: {default: (code: string) => string}, glimmer: typeof import('@glimmer/syntax')) => callback({ transpile: transpile.default, glimmer }),
    );
  },

  transform({ transpile, glimmer }: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/syntax')}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    const transformModule = compileModule(transformCode);

    // allow "export default" instead of "module.exports = "
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    let ast = glimmer.preprocess(code, {
      plugins: {
        ast: [(transform as import('@glimmer/syntax').ASTPluginBuilder)],
      },
    });

    return glimmer.print(ast);
  },
};
