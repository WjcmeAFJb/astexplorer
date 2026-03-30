import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'yaml/package.json';

type YamlModule = typeof import('yaml');
type YamlNode = { range?: [number, number], type?: string, key?: YamlNode | null, value?: YamlNode | null, [key: string]: unknown };

const ID = 'yaml';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(callback: (realParser: typeof import('yaml')) => void) {
    require(['yaml'], callback);
  },

  nodeToRange(node: {range?: [number, number], type?: string, key?: {range?: [number, number]}, value?: {range?: [number, number]}, [key: string]: unknown}) {
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

  parse({ parseAllDocuments }: typeof import('yaml'), code: string, options: import('yaml').Options) {
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
