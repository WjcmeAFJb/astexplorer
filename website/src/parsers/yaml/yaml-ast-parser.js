import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'yaml-ast-parser/package.json';

/**
 * @typedef {import('yaml-ast-parser')} YamlAstParserModule
 * @typedef {import('yaml-ast-parser').YAMLNode} YamlAstNode
 */

const ID = 'yaml-ast-parser';
/** @type {Record<number, string> | null} */
let Kind = null;

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://www.npmjs.com/package/yaml-ast-parser',

  _ignoredProperties: new Set(['parent', 'errors']),
  locationProps: new Set(['startPosition', 'endPosition']),
  typeProps: new Set(['kind']),

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
    if (typeof node.startPosition === 'number') {
      return [node.startPosition, node.endPosition];
    }
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return /** @type {Record<string, unknown>} */ Kind[node.kind];
  },

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['yaml-ast-parser'], function(yamlAstParser) {
      Kind = yamlAstParser.Kind;
      callback(yamlAstParser);
    });
  },

  parse(/** @type {Record<string, Function>} */ { load }, /** @type {string} */ code) {
    return load(code);
  },
};
