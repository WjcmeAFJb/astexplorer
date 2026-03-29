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

  loadParser(/** @type {*} */ callback) {
    require(['redot'], callback);
  },

  parse(/** @type {*} */ redot, /** @type {*} */ code) {
    return redot().parse(code);
  },

  nodeToRange(/** @type {*} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'children';
  },
};
