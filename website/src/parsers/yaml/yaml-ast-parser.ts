import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'yaml-ast-parser/package.json';
import type { YAMLNode as YamlAstNode } from 'yaml-ast-parser';

type YamlAstParserModule = typeof import('yaml-ast-parser');

const ID = 'yaml-ast-parser';
let Kind: typeof import('yaml-ast-parser').Kind | null = (null as typeof import('yaml-ast-parser').Kind | null);

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://www.npmjs.com/package/yaml-ast-parser',

  _ignoredProperties: new Set(['parent', 'errors']),
  locationProps: new Set(['startPosition', 'endPosition']),
  typeProps: new Set(['kind']),

  nodeToRange(node: {startPosition?: number, endPosition?: number, [key: string]: unknown}) {
    if (typeof node.startPosition === 'number') {
      return [node.startPosition, node.endPosition];
    }
  },

  getNodeName(node: {kind?: number, [key: string]: unknown}) {
    return Kind ? Kind[(node.kind as number)] : undefined;
  },

  loadParser(callback: (realParser: typeof import('yaml-ast-parser')) => void) {
    require(['yaml-ast-parser'], function(yamlAstParser: typeof import('yaml-ast-parser')) {
      Kind = yamlAstParser.Kind;
      callback(yamlAstParser);
    });
  },

  parse({ load }: typeof import('yaml-ast-parser'), code: string) {
    return load(code);
  },
};
