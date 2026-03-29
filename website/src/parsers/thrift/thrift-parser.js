import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@creditkarma/thrift-parser/package.json';

const ID = 'ck-thrift-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/creditkarma/thrift-parser',
  locationProps: new Set(['location']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@creditkarma/thrift-parser'], callback);
  },

  parse(/** @type {DynModule} */ {parse}, /** @type {string} */ code) {
    return parse(code);
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.type;
  },

  nodeToRange(/** @type {DynModule} */ { loc }) {
    if (loc !== null && loc !== undefined) {
      return [loc.start.index, loc.end.index];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return node === 'ThriftDocument' || key === 'body';
  },
};
