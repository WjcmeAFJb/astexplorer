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

  loadTransformer(/** @type {*} */ callback) {
    require(
      ['../../../transpilers/babel', 'prettier/standalone', 'prettier/parser-babel'],
      (transpile, prettier, babel) => callback({ transpile: transpile.default, prettier, babel }),
    );
  },

  transform(/** @type {*} */ { transpile, prettier, babel }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    transformCode = transpile(transformCode);
    const options = compileModule(transformCode);
    return prettier.format(
      code,
      Object.assign({plugins: [babel]}, options.default || options),
    );
  },
};
