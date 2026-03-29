import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'redot/package.json';

const ID = 'redot';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['redot'], callback);
  },

  parse(/** @type {DynModule} */ redot, /** @type {string} */ code) {
    return redot().parse(code);
  },

  nodeToRange(/** @type {DynModule} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },
};
