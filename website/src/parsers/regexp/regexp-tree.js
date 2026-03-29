import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'regexp-tree/package.json';

const ID = 'regexp-tree';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),

  loadParser(/** @type {*} */ callback) {
    require(['regexp-tree'], (regexpTree) => {
      callback(regexpTree);
    });
  },

  parse(/** @type {*} */ regexpTree, /** @type {*} */ code, options={}) {
    regexpTree
      .parser
      .setOptions(options);

    return regexpTree.parse(code);
  },

  nodeToRange(/** @type {*} */ node) {
    if (node.loc != null) {
      return [node.loc.start, node.loc.end];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return (
      node.type === 'RegExp' ||
      key === 'body' ||
      key === 'expressions'
    );
  },

  getDefaultOptions() {
    return {
      captureLocations: true,
    };
  },

};
