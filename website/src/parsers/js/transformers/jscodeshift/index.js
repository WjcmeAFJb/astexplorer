import compileModule from '../../../utils/compileModule';
import pkg from 'jscodeshift/package.json';

const ID = 'jscodeshift';

const sessionMethods = new Set();

// https://github.com/facebook/jscodeshift#parser
const getJscodeshiftParser = (/** @type {string} */ parser, /** @type {Record<string, unknown>} */ parserSettings) => {
  if (parser === 'typescript') {
    if (parserSettings.typescript && /** @type {{jsx?: boolean}} */ (parserSettings.typescript).jsx === false) {
      return 'ts'
    }
    return 'tsx'
  }
  if (parser === 'flow') {
    return 'flow'
  }
  return 'babel'
}

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/facebook/jscodeshift',

  defaultParserID: 'recast',
  compatibleParserIDs: new Set([
    'typescript',
    'flow',
  ]),

  formatCodeExample(/** @type {string} */ codeExample, /** @type {{parser: string, parserSettings: Record<string, unknown>}} */ { parser, parserSettings }) {
    return codeExample.replace('{{parser}}', `${getJscodeshiftParser(parser, parserSettings)}`)
  },

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, jscodeshift: import('jscodeshift').JSCodeshift}) => void} */ callback) {
    require(['../../../transpilers/babel', 'jscodeshift'], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {import('jscodeshift').JSCodeshift} */ jscodeshift) => {
        const { registerMethods } = jscodeshift;

        /** @type {Set<string> | undefined} */
        let origMethods;

        jscodeshift.registerMethods({
          hasOwnProperty(/** @type {string} */ name) {
            // compare only against current-session & very original methods
            if (!origMethods) {
              origMethods = new Set(Object.getOwnPropertyNames(this));
            }
            return origMethods.has(name) || sessionMethods.has(name);
          },
        });

        // patch in order to collect user-defined method names
        jscodeshift.registerMethods = function (/** @type {object} */ methods) {
          registerMethods.apply(this, arguments);
          for (let name in methods) {
            sessionMethods.add(name);
          }
        };

        callback({ transpile: transpile.default, jscodeshift });
      },
    );
  },

  transform(
    /** @type {{transpile: (code: string) => string, jscodeshift: import('jscodeshift').JSCodeshift}} */ { transpile, jscodeshift },
    /** @type {string} */ transformCode,
    /** @type {string} */ code,
  ) {
    sessionMethods.clear();
    transformCode = transpile(transformCode);
    const transformModule = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    const counter = /** @type {Record<string, number>} */ (Object.create(null));
    let statsWasCalled = false;

    const result = transform(
      {
        path: 'Live.js',
        source: code,
      },
      {
        jscodeshift: transformModule.parser ?
          jscodeshift.withParser(/** @type {string} */ (transformModule.parser)) :
          jscodeshift,
        stats: (/** @type {string} */ value, quantity=1) => {
          statsWasCalled = true;
          counter[value] = (counter[value] ? counter[value] : 0) + quantity;
        },
      },
      {},
    );
    if (statsWasCalled) {
      console.log(JSON.stringify(counter, null, 4)); // eslint-disable-line no-console
    }
    if (result == null) {
      // If null is returned, the jscodeshift runner won't touch the original
      // code, so we just return that.
      return code;
    } else if (typeof result !== 'string') {
      throw new Error(
        'Transformers must either return undefined, null or a string, not ' +
        `"${typeof result}".`,
      );
    }
    return result;
  },
};
