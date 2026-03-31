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
    return (((parser.parseTemplate(code, options) as import('san').AElement)).children[0] as import('san').AElement);
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
