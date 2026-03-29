import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'babel-eslint8/package.json';

const ID = 'babel-eslint8';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end', 'range']),
  showInMenu: false,

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['babel-eslint8'], callback);
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
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
