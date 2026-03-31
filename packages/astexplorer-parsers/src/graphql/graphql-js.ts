import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'graphql/package.json';
type GraphQLASTNode = import('graphql/language').ASTNode;

type GraphQLParser = { parse: typeof import('graphql/language').parse };

const ID = 'graphql-js';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),
  typeProps: new Set(['kind']),

  loadParser(callback: (realParser: GraphQLParser) => void) {
    require(['graphql/language'], ({ parse }: GraphQLParser) => {
      // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
      callback({ parse });
    });
  },

  parse({ parse }: GraphQLParser, code: string, options: Record<string, unknown>) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return), typescript-eslint(no-unsafe-call) -- import type may not resolve
    return parse(code, options);
  },

  nodeToRange(node: {loc?: {start: number, end: number}, [key: string]: unknown}) {
    if (node.loc) {
      return [node.loc.start, node.loc.end];
    }
  },

  getNodeName(node: Record<string, unknown>) {
    return node.kind;
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return key === 'definitions';
  },

  getDefaultOptions() {
    return {
      noLocation: false,
      noSource: false,
    };
  },
};
