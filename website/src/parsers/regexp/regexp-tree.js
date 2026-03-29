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

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['regexp-tree'], (regexpTree) => {
      callback(regexpTree);
    });
  },

  parse(/** @type {DynModule} */ regexpTree, /** @type {string} */ code, options={}) {
    regexpTree
      .parser
      .setOptions(options);

    return regexpTree.parse(code);
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node.loc != null) {
      return [node.loc.start, node.loc.end];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
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
