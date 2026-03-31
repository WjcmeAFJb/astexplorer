import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babel-eslint/package.json';

const ID = 'babel-eslint';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end', 'range']),
  showInMenu: false,

  loadParser(callback: (realParser: Record<string, unknown>) => void) {
    require(['babel-eslint'], callback);
  },

  parse(parser: {parseNoPatch: (code: string, opts: Record<string, unknown>) => Record<string, unknown>}, code: string) {
    const opts = {
      sourceType: 'module',
    };

    const ast = parser.parseNoPatch(code, opts);
    delete ast.tokens;
    return ast;
  },

  nodeToRange(node: {start?: number, end?: number, [key: string]: unknown}) {
    if (typeof node.start !== 'undefined') {
      return [node.start, node.end];
    }
  },

  _ignoredProperties: new Set([
    '_paths',
    '_babelType',
    '__clone',
  ]),
};
