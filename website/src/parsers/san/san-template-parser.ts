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

  loadParser(callback: (realParser: typeof import('san')) => void) {
    require(['san'], callback);
  },

  parse(parser: typeof import('san'), code: string, options: Parameters<typeof import('san').parseTemplate>[1]) {
    return /** @type {import('san').AElement} */ ((/** @type {import('san').AElement} */ (parser.parseTemplate(code, options))).children[0]);
  },

  opensByDefault(node: import('san').AElement, key: string) {
    return key === 'children';
  },

  getNodeName(node: import('san').AElement) {
    return node.tagName;
  },

  getDefaultOptions() {
    return {};
  },
  _ignoredProperties: new Set([]),
};
