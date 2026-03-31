import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'vue-template-compiler/package.json';

const ID = 'vue-template-compiler';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(callback: (realParser: typeof import('vue-template-compiler')) => void) {
    require(['vue-template-compiler/browser'], callback);
  },

  parse(parser: typeof import('vue-template-compiler'), code: string, options: Parameters<typeof import('vue-template-compiler').compile>[1]) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(node: {type?: string, name?: string, start?: number, end?: number, [key: string]: unknown}) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(node: import('vue-template-compiler').ASTNode, key: string) {
    return key === 'children';
  },

  getNodeName(node: {tag?: string}) {
    return node.tag;
  },

  getDefaultOptions() {
    return {
      outputSourceRange: true,
      whitespace: 'preserve',
    };
  },
  _ignoredProperties: new Set(['parent']),
};
