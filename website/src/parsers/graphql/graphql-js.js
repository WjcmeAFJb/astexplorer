import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'graphql/package.json';

const ID = 'graphql-js';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),
  typeProps: new Set(['kind']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['graphql/language'], ({ parse }) => {
      callback({ parse });
    });
  },

  parse(/** @type {DynModule} */ { parse }, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parse(code, options);
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node.loc) {
      return [node.loc.start, node.loc.end];
    }
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.kind;
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'definitions';
  },

  getDefaultOptions() {
    return {
      noLocation: false,
      noSource: false,
    };
  },
};
