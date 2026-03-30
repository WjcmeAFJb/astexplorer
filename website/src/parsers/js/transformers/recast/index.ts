import compileModule from '../../../utils/compileModule';
import pkg from 'recast/package.json';

const ID = 'recast';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/benjamn/recast',

  defaultParserID: 'recast',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, recast: typeof import('recast'), parsers: Record<string, object>}) => void} */ callback) {
    require(
      [
        '../../../transpilers/babel',
        'recast',
        'recast/parsers/acorn',
        'recast/parsers/babel',
        'recast/parsers/babylon',
        'recast/parsers/esprima',
        'recast/parsers/flow',
        'recast/parsers/typescript',
      ],
      (/** @type {{default: (code: string) => string}} */ transpile, recast: typeof import('recast'), acorn: object, babel: object, babylon: object, esprima: object, flow: object, typescript: object) => {
        callback({
          transpile: transpile.default,
          recast,
          parsers: {
            acorn,
            babel,
            babylon,
            esprima,
            flow,
            typescript,
          },
        });
      },
    );
  },

  transform(
    /** @type {{transpile: (code: string) => string, recast: typeof import('recast'), parsers: Record<string, object>}} */ { transpile, recast, parsers },
    transformCode: string,
    code: string,
  ) {
    transformCode = transpile(transformCode);
    const transformModule = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    const result = transform(
      code,
      {
        recast,
        parsers,
      },
    );
    if (typeof result !== 'string') {
      throw new Error(
        'Transformers must either return undefined, null or a string, not ' +
        `"${typeof result}".`,
      );
    }
    return result;
  },
};
