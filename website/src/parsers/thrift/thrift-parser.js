import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@creditkarma/thrift-parser/package.json';

/**
 * @typedef {{ parse(code: string): object }} ThriftParser
 * @typedef {{ type?: string, loc?: { start: { index: number }, end: { index: number } } | null, [key: string]: unknown }} ThriftNode
 */

const ID = 'ck-thrift-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/creditkarma/thrift-parser',
  locationProps: new Set(['location']),

  loadParser(/** @type {(realParser: {parse: (code: string) => object}) => void} */ callback) {
    require(['@creditkarma/thrift-parser'], callback);
  },

  parse(/** @type {{parse: (code: string) => object}} */ {parse}, /** @type {string} */ code) {
    return parse(code);
  },

  getNodeName(/** @type {ThriftNode} */ node) {
    return node.type;
  },

  nodeToRange(/** @type {ThriftNode} */ { loc }) {
    if (loc !== null && loc !== undefined) {
      return [loc.start.index, loc.end.index];
    }
  },

  opensByDefault(/** @type {ThriftNode | string} */ node, /** @type {string} */ key) {
    return node === 'ThriftDocument' || key === 'body';
  },
};
