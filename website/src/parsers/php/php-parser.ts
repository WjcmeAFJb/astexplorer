import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'php-parser/package.json';
import type { Node as PhpNode } from 'php-parser';

type PhpParserEngine = typeof import('php-parser').Engine;

const ID = 'php-parser';

const defaultOptions = {
  parser: {
    extractDoc: true,
  },
  ast: {
    withPositions: true,
  },
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),
  typeProps: new Set(['kind']),

  loadParser(callback: (realParser: PhpParserEngine) => void) {
    require(['php-parser'], callback);
  },

  parse(Engine: PhpParserEngine, code: string) {
    const parser = new Engine(defaultOptions);
    return parser.parseCode(code, '');
  },

  getNodeName(node: PhpNode) {
    return node.kind;
  },

  nodeToRange(node: PhpNode) {
    if (node.loc && node.loc.start && node.loc.end) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(node: PhpNode, key: string) {
    return key === 'body' || key === 'what' || key === 'items';
  },
};
