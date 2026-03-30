import compileModule from '../../../utils/compileModule';
import pkg from '@glimmer/compiler/package.json';

const ID = 'glimmer-compiler';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  defaultParserID: 'glimmer',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/compiler')}) => void) {
    require(
      ['../../../transpilers/babel', '@glimmer/compiler'],
      (transpile: {default: (code: string) => string}, glimmer: typeof import('@glimmer/compiler')) => callback({ transpile: transpile.default, glimmer }),
    );
  },

  transform({ transpile, glimmer }: {transpile: (code: string) => string, glimmer: typeof import('@glimmer/compiler')}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    const transformModule = compileModule(transformCode);

    // allow "export default" instead of "module.exports = "
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    // compile template to wireformat
    let result = glimmer.precompile(code, {
      plugins: {
        ast: [((transform as unknown) as import('@glimmer/syntax').ASTPluginBuilder)],
      },
    });

    // parse wireformat into JSON
    let json = (JSON.parse(((JSON.parse(result) as {block: string}).block as string)) as string);

    // pretty print JSON
    return { code: (json as string) };
  },
};
