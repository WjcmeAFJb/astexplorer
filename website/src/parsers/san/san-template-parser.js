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

  loadParser(/** @type {(realParser: typeof import('san')) => void} */ callback) {
    require(['san'], callback);
  },

  parse(/** @type {typeof import('san')} */ parser, /** @type {string} */ code, /** @type {Parameters<typeof import('san').parseTemplate>[1]} */ options) {
    return /** @type {import('san').AElement} */ ((/** @type {import('san').AElement} */ (parser.parseTemplate(code, options))).children[0]);
  },

  opensByDefault(/** @type {import('san').AElement} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {import('san').AElement} */ node) {
    return node.tagName;
  },

  getDefaultOptions() {
    return {};
  },
  _ignoredProperties: new Set([]),
};
