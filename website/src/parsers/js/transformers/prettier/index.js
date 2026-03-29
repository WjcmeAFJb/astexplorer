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

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, prettier: {format: (code: string, options: object) => string}, babel: object}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', 'prettier/standalone', 'prettier/parser-babel'],
      (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{format: (code: string, options: object) => string}} */ prettier, /** @type {object} */ babel) => callback({ transpile: transpile.default, prettier, babel }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, prettier: {format: (code: string, options: object) => string}, babel: object}} */ { transpile, prettier, babel }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    const options = compileModule(transformCode);
    return prettier.format(
      code,
      Object.assign({plugins: [babel]}, options.default || options),
    );
  },
};
