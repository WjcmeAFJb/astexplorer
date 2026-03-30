import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'yaml/package.json';

/**
 * @typedef {typeof import('yaml')} YamlModule
 * @typedef {{ range?: [number, number], type?: string, key?: YamlNode | null, value?: YamlNode | null, [key: string]: unknown }} YamlNode
 */

const ID = 'yaml';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: typeof import('yaml')) => void} */ callback) {
    require(['yaml'], callback);
  },

  nodeToRange(/** @type {{range?: [number, number], type?: string, key?: {range?: [number, number]}, value?: {range?: [number, number]}, [key: string]: unknown}} */ node) {
    if (node.range) {
      return node.range;
    }
    if (node.type === 'PAIR' && (node.key || node.value)) {
      if (node.key && node.value) {
        return [node.key.range[0], node.value.range[1]];
      } else if (node.key) {
        return node.key.range;
      } else {
        return node.value.range;
      }
    }
  },

  parse(/** @type {typeof import('yaml')} */ { parseAllDocuments }, /** @type {string} */ code, /** @type {import('yaml').Options} */ options) {
    return parseAllDocuments(code, options);
  },

  getDefaultOptions() {
    return {
      keepBlobsInJSON: true,
      keepCstNodes: false,
      keepNodeTypes: true,
      merge: false,
      mapAsMap: false,
      simpleKeys: false,
      maxAliasCount: 100,
      prettyErrors: true,
    };
  },
};
