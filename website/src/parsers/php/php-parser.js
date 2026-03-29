import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'php-parser/package.json';

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

  loadParser(/** @type {*} */ callback) {
    require(['php-parser'], callback);
  },

  parse(/** @type {*} */ Engine, /** @type {*} */ code) {
    const parser = new Engine(defaultOptions);
    return parser.parseCode(code, '');
  },

  getNodeName(/** @type {*} */ node) {
    return node.kind;
  },

  nodeToRange(/** @type {*} */ node) {
    if (node.loc && node.loc.start && node.loc.end) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'body' || key === 'what' || key === 'items';
  },
};
