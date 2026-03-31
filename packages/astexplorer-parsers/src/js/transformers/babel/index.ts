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

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}}) => void) {
    require(
      ['../../../transpilers/babel', 'babel5'],
      (transpile: {default: (code: string) => string}, babel: {transform: (...args: unknown[]) => unknown}) => callback({ transpile: transpile.default, babel: babel }),
    );
  },

  transform({ transpile, babel }: {transpile: (code: string) => string, babel: {transform: (...args: unknown[]) => unknown}}, transformCode: string, code: string) {
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
