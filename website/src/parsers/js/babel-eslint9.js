import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babel-eslint9/package.json';

const ID = 'babel-eslint9';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end', 'range']),

  loadParser(/** @type {(realParser: Record<string, unknown>) => void} */ callback) {
    require(['babel-eslint9'], callback);
  },

  parse(/** @type {{parseNoPatch: (code: string, opts: Record<string, unknown>) => Record<string, unknown>}} */ parser, /** @type {string} */ code) {
    const opts = {
      sourceType: 'module',
    };

    const ast = parser.parseNoPatch(code, opts);
    delete ast.tokens;
    return ast;
  },

  nodeToRange(/** @type {{start?: number, end?: number, [key: string]: unknown}} */ node) {
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
