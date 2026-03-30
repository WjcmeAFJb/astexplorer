import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@creditkarma/thrift-parser/package.json';

/**
 * @typedef {typeof import('@creditkarma/thrift-parser')} ThriftParserModule
 */

const ID = 'ck-thrift-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/creditkarma/thrift-parser',
  locationProps: new Set(['location']),

  loadParser(/** @type {(realParser: ThriftParserModule) => void} */ callback) {
    require(['@creditkarma/thrift-parser'], callback);
  },

  parse(/** @type {ThriftParserModule} */ {parse}, /** @type {string} */ code) {
    return parse(code);
  },

  getNodeName(/** @type {{type?: string}} */ node) {
    return node.type;
  },

  nodeToRange(/** @type {{loc?: {start: {index: number}, end: {index: number}} | null}} */ { loc }) {
    if (loc !== null && loc !== undefined) {
      return [loc.start.index, loc.end.index];
    }
  },

  opensByDefault(/** @type {{type?: string} | string} */ node, /** @type {string} */ key) {
    return node === 'ThriftDocument' || key === 'body';
  },
};
