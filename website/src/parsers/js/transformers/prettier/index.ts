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

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, prettier: typeof import('prettier'), babel: import('prettier').Plugin}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', 'prettier/standalone', 'prettier/parser-babel'],
      (/** @type {{default: (code: string) => string}} */ transpile, prettier: typeof import('prettier'), babel: import('prettier').Plugin) => callback({ transpile: transpile.default, prettier, babel }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, prettier: typeof import('prettier'), babel: import('prettier').Plugin}} */ { transpile, prettier, babel }, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    const options = compileModule(transformCode);
    return prettier.format(
      code,
      Object.assign({plugins: [babel]}, options.default || options),
    );
  },
};
