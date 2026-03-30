import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@vue/compiler-dom/package.json';

const ID = '@vue/compiler-dom';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(callback: (realParser: typeof import('@vue/compiler-dom')) => void) {
    require(['@vue/compiler-dom'], callback);
  },

  parse(parser: typeof import('@vue/compiler-dom'), code: string, options: import('@vue/compiler-dom').ParserOptions) {
    return parser.parse(code, options);
  },

  nodeToRange(/** @type {{type?: string, name?: string, loc?: {start: {offset: number}, end: {offset: number}}, [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(node: import('@vue/compiler-dom').TemplateChildNode, key: string) {
    return key === 'children';
  },

  getNodeName(/** @type {{tag?: string}} */ node) {
    return node.tag;
  },

  getDefaultOptions() {
    return {};
  },

  _ignoredProperties: new Set([
    'components',
    'directives',
    'codegenNode',
    'helpers',
    'hoists',
    'imports',
    'cached',
    'temps',
  ]),
};
