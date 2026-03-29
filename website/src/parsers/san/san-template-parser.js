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

  loadParser(/** @type {(realParser: {parseTemplate: (code: string, options: Record<string, unknown>) => {children: object[]}}) => void} */ callback) {
    require(['san'], callback);
  },

  parse(/** @type {{parseTemplate: (code: string, options: Record<string, unknown>) => {children: object[]}}} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.parseTemplate(code, options).children[0];
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.tagName;
  },

  getDefaultOptions() {
    return {};
  },
  _ignoredProperties: new Set([]),
};
