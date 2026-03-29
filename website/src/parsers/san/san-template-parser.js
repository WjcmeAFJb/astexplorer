import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'san/package.json';

const ID = 'san';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set([]),
  typeProps: new Set(['tag']),

  loadParser(/** @type {*} */ callback) {
    require(['san'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code, /** @type {*} */ options) {
    return parser.parseTemplate(code, options).children[0];
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {*} */ node) {
    return node.tagName;
  },

  getDefaultOptions() {
    return {};
  },
  _ignoredProperties: new Set([]),
};
