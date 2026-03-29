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

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['regexp-tree'], (regexpTree) => {
      callback(regexpTree);
    });
  },

  parse(/** @type {Record<string, any>} */ regexpTree, /** @type {string} */ code, options={}) {
    regexpTree
      .parser
      .setOptions(options);

    return regexpTree.parse(code);
  },

  nodeToRange(/** @type {any} */ node) {
    if (node.loc != null) {
      return [node.loc.start, node.loc.end];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
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
