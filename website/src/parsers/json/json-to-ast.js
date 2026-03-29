import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'json-to-ast/package.json';

/**
 * @typedef {(code: string) => JsonToAstNode} JsonToAstParser
 * @typedef {{ loc?: { start: { offset: number }, end: { offset: number } }, [key: string]: unknown }} JsonToAstNode
 */

const ID = 'jsonToAst';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: JsonToAstParser) => void} */ callback) {
    require(['json-to-ast'], callback);
  },

  parse(/** @type {JsonToAstParser} */ jsonToAst, /** @type {string} */ code) {
    return jsonToAst(code);
  },

  nodeToRange(/** @type {JsonToAstNode} */ {loc}) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },
}
