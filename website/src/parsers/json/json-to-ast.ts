import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'json-to-ast/package.json';
type JsonToAstNode = import('json-to-ast').ValueNode;

type JsonToAstParser = typeof import('json-to-ast');

const ID = 'jsonToAst';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(callback: (realParser: JsonToAstParser) => void) {
    require(['json-to-ast'], callback);
  },

  parse(jsonToAst: JsonToAstParser, code: string) {
    return jsonToAst(code);
  },

  nodeToRange({loc}: import('json-to-ast').ASTNode) {
    if (loc) {
      return [
        loc.start.offset,
        loc.end.offset,
      ];
    }
  },
}
