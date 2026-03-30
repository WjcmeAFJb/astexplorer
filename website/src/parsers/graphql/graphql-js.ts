import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'graphql/package.json';

/**
 * @typedef {{ parse: import('graphql/language').parse }} GraphQLParser
 * @typedef {import('graphql/language').ASTNode} GraphQLASTNode
 */

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
    require(['graphql/language'], (/** @type {GraphQLParser} */ { parse }) => {
      // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- import type may not resolve
      callback({ parse });
    });
  },

  parse(/** @type {GraphQLParser} */ { parse }, code: string, options: Record<string, unknown>) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return), typescript-eslint(no-unsafe-call) -- import type may not resolve
    return parse(code, options);
  },

  nodeToRange(/** @type {{loc?: {start: number, end: number}, [key: string]: unknown}} */ node) {
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
