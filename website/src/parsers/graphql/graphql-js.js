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

  loadParser(/** @type {*} */ callback) {
    require(['graphql/language'], ({ parse }) => {
      callback({ parse });
    });
  },

  parse(/** @type {*} */ { parse }, /** @type {*} */ code, /** @type {*} */ options) {
    return parse(code, options);
  },

  nodeToRange(/** @type {*} */ node) {
    if (node.loc) {
      return [node.loc.start, node.loc.end];
    }
  },

  getNodeName(/** @type {*} */ node) {
    return node.kind;
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'definitions';
  },

  getDefaultOptions() {
    return {
      noLocation: false,
      noSource: false,
    };
  },
};
