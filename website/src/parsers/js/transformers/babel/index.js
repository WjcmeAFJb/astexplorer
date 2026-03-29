import compileModule from '../../../utils/compileModule';
import pkg from 'babel5/package.json';

const ID = 'babel';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: false,

  defaultParserID: 'babylon',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, babel: {transform: Function}}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', 'babel5'],
      (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{transform: Function}} */ babel) => callback({ transpile: transpile.default, babel: babel }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, babel: {transform: Function}}} */ { transpile, babel }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );

    return babel.transform(code, {
      whitelist: [],
      plugins: [transform.default || transform],
      sourceMaps: true,
    });
  },
};
