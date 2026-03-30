import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'yaml-ast-parser/package.json';

/**
 * @typedef {import('yaml-ast-parser')} YamlAstParserModule
 * @typedef {import('yaml-ast-parser').YAMLNode} YamlAstNode
 */

const ID = 'yaml-ast-parser';
/** @type {typeof import('yaml-ast-parser').Kind | null} */
let Kind = /** @type {typeof import('yaml-ast-parser').Kind | null} */ (null);

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://www.npmjs.com/package/yaml-ast-parser',

  _ignoredProperties: new Set(['parent', 'errors']),
  locationProps: new Set(['startPosition', 'endPosition']),
  typeProps: new Set(['kind']),

  nodeToRange(/** @type {{startPosition?: number, endPosition?: number, [key: string]: unknown}} */ node) {
    if (typeof node.startPosition === 'number') {
      return [node.startPosition, node.endPosition];
    }
  },

  getNodeName(/** @type {{kind?: number, [key: string]: unknown}} */ node) {
    return Kind ? Kind[/** @type {number} */ (node.kind)] : undefined;
  },

  loadParser(/** @type {(realParser: typeof import('yaml-ast-parser')) => void} */ callback) {
    require(['yaml-ast-parser'], function(/** @type {typeof import('yaml-ast-parser')} */ yamlAstParser) {
      Kind = yamlAstParser.Kind;
      callback(yamlAstParser);
    });
  },

  parse(/** @type {typeof import('yaml-ast-parser')} */ { load }, /** @type {string} */ code) {
    return load(code);
  },
};
