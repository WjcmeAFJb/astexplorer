import compileModule from '../../../utils/compileModule';
import pkg from 'prettier/package.json';

const ID = 'prettier';
const name = 'prettier';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babylon7',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, prettier: typeof import('prettier'), babel: import('prettier').Plugin}) => void) {
    require(
      ['../../../transpilers/babel', 'prettier/standalone', 'prettier/parser-babel'],
      (transpile: {default: (code: string) => string}, prettier: typeof import('prettier'), babel: import('prettier').Plugin) => callback({ transpile: transpile.default, prettier, babel }),
    );
  },

  transform({ transpile, prettier, babel }: {transpile: (code: string) => string, prettier: typeof import('prettier'), babel: import('prettier').Plugin}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    const options = compileModule(transformCode);
    return prettier.format(
      code,
      Object.assign({plugins: [babel]}, options.default || options),
    );
  },
};
