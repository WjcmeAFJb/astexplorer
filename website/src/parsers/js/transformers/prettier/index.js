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

  loadTransformer(/** @type {(realTransformer: Record<string, any>) => void} */ callback) {
    require(
      ['../../../transpilers/babel', 'prettier/standalone', 'prettier/parser-babel'],
      (/** @type {any} */ transpile, /** @type {any} */ prettier, /** @type {any} */ babel) => callback({ transpile: transpile.default, prettier, babel }),
    );
  },

  transform(/** @type {Record<string, any>} */ { transpile, prettier, babel }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    const options = compileModule(transformCode);
    return prettier.format(
      code,
      Object.assign({plugins: [babel]}, options.default || options),
    );
  },
};
