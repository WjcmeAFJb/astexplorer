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

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}}) => void} */ callback) {
    require(
      ['../../../transpilers/babel', 'babel5'],
      (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{transform: (...args: unknown[]) => unknown}} */ babel) => callback({ transpile: transpile.default, babel: babel }),
    );
  },

  transform(/** @type {{transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}}} */ { transpile, babel }, transformCode: string, code: string) {
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
