import compileModule from '../../../utils/compileModule';
import pkg from 'jscodeshift/package.json';

const ID = 'jscodeshift';

const sessionMethods = new Set();

// https://github.com/facebook/jscodeshift#parser
const getJscodeshiftParser = (parser: string, parserSettings: Record<string, unknown>) => {
  if (parser === 'typescript') {
    if (parserSettings.typescript && (parserSettings.typescript as {jsx?: boolean}).jsx === false) {
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

  formatCodeExample(codeExample: string, { parser, parserSettings }: {parser: string, parserSettings: Record<string, unknown>}) {
    return codeExample.replace('{{parser}}', `${getJscodeshiftParser(parser, parserSettings)}`)
  },

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, jscodeshift: import('jscodeshift').JSCodeshift}) => void) {
    require(['../../../transpilers/babel', 'jscodeshift'], (transpile: {default: (code: string) => string}, jscodeshift: import('jscodeshift').JSCodeshift) => {
        const { registerMethods } = jscodeshift;

                let origMethods: Set<string> | undefined;

        jscodeshift.registerMethods({
          hasOwnProperty(name: string) {
            // compare only against current-session & very original methods
            if (!origMethods) {
              origMethods = new Set(Object.getOwnPropertyNames(this));
            }
            return origMethods.has(name) || sessionMethods.has(name);
          },
        });

        // patch in order to collect user-defined method names
        jscodeshift.registerMethods = function (methods: object) {
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
    { transpile, jscodeshift }: {transpile: (code: string) => string, jscodeshift: import('jscodeshift').JSCodeshift},
    transformCode: string,
    code: string,
  ) {
    sessionMethods.clear();
    transformCode = transpile(transformCode);
    const transformModule = compileModule( // eslint-disable-line no-shadow
      transformCode,
    );
    const transform = transformModule.__esModule ?
      transformModule.default :
      transformModule;

    const counter = (Object.create(null) as Record<string, number>);
    let statsWasCalled = false;

    const result = transform(
      {
        path: 'Live.js',
        source: code,
      },
      {
        jscodeshift: transformModule.parser ?
          jscodeshift.withParser((transformModule.parser as string)) :
          jscodeshift,
        stats: (value: string, quantity=1) => {
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
