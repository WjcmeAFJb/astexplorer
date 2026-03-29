import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'esformatter-parser/package.json';

const ID = 'esformatter-parser';
const name = 'esformatter';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end', 'range']),

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['esformatter-parser'], (parser) => {
      callback(parser);
    });
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
    return parser.parse(code);
  },

  *forEachProperty(/** @type {Record<string, unknown>} */ node) {
    if (node && typeof node === 'object') {
      for (let prop in node) {
        if (this._ignoredProperties.has(prop)) {
          continue;
        }

        let value = node[prop];

        if (node.type !== 'Program' && prop === 'parent') {
          value = '[Circular]';
        }

        yield {
          value,
          key: prop,
          computed: false,
        }
      }
    }
  },

  _ignoredProperties: new Set([
    '_paths',
    '_babelType',
    '__clone',
    // hide some extra properties to reduce noise
    'comments',
    'directives',
    'extra',
    'leadingComments',
    'root',
    'sourceType',
    'tokens',
    'trailingComments',
  ]),
};
