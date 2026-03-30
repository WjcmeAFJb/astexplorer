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

  loadParser(/** @type {(realParser: typeof import('@vue/compiler-dom')) => void} */ callback) {
    require(['@vue/compiler-dom'], callback);
  },

  parse(/** @type {typeof import('@vue/compiler-dom')} */ parser, /** @type {string} */ code, /** @type {import('@vue/compiler-dom').ParserOptions} */ options) {
    return parser.parse(code, options);
  },

  nodeToRange(/** @type {{type?: string, name?: string, loc?: {start: {offset: number}, end: {offset: number}}, [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(/** @type {import('@vue/compiler-dom').TemplateChildNode} */ node, /** @type {string} */ key) {
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
