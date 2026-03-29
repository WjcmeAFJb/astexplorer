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

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['graphql/language'], ({ parse }) => {
      callback({ parse });
    });
  },

  parse(/** @type {Record<string, Function>} */ { parse }, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parse(code, options);
  },

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
    if (node.loc) {
      return [node.loc.start, node.loc.end];
    }
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.kind;
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'definitions';
  },

  getDefaultOptions() {
    return {
      noLocation: false,
      noSource: false,
    };
  },
};
