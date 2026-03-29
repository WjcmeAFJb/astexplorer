import compileModule from '../../../utils/compileModule';
import pkg from 'jscodeshift/package.json';

const ID = 'jscodeshift';

const sessionMethods = new Set();

// https://github.com/facebook/jscodeshift#parser
const getJscodeshiftParser = (/** @type {any} */ parser, /** @type {any} */ parserSettings) => {
  if (parser === 'typescript') {
    if (parserSettings.typescript && /** @type {any} */ (parserSettings.typescript).jsx === false) {
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

  formatCodeExample(/** @type {any} */ codeExample, /** @type {any} */ { parser, parserSettings }) {
    return codeExample.replace('{{parser}}', `${getJscodeshiftParser(parser, parserSettings)}`)
  },

  loadTransformer(/** @type {(realTransformer: any) => void} */ callback) {
    require(['../../../transpilers/babel', 'jscodeshift'], (/** @type {any} */ transpile, /** @type {any} */ jscodeshift) => {
        const { registerMethods } = jscodeshift;

        /** @type {any} */
        let origMethods;

        jscodeshift.registerMethods({
          hasOwnProperty(/** @type {string} */ name) {
            // compare only against current-session & very original methods
            if (!/** @type {any} */ origMethods) {
              origMethods = new Set(Object.getOwnPropertyNames(this));
            }
            return /** @type {any} */ origMethods.has(name) || sessionMethods.has(name);
          },
        });

        // patch in order to collect user-defined method names
        jscodeshift.registerMethods = function (/** @type {any} */ methods) {
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
    /** @type {any} */ { transpile, jscodeshift },
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

    const counter = Object.create(null);
    let statsWasCalled = false;

    const result = transform(
      {
        path: 'Live.js',
        source: code,
      },
      {
        jscodeshift: transformModule.parser ?
          jscodeshift.withParser(transformModule.parser) :
          jscodeshift,
        stats: (/** @type {any} */ value, quantity=1) => {
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
