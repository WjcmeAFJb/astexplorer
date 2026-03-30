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

  loadParser(/** @type {(realParser: typeof import('regexp-tree') & {parser: {setOptions: (options: import('regexp-tree').ParserOptions) => void}}) => void} */ callback) {
    require(['regexp-tree'], (/** @type {typeof import('regexp-tree') & {parser: {setOptions: (options: import('regexp-tree').ParserOptions) => void}}} */ regexpTree) => {
      callback(regexpTree);
    });
  },

  parse(/** @type {typeof import('regexp-tree') & {parser: {setOptions: (options: import('regexp-tree').ParserOptions) => void}}} */ regexpTree, code: string, options={}) {
    regexpTree
      .parser
      .setOptions(options);

    return regexpTree.parse(code);
  },

  nodeToRange(node: import('regexp-tree/ast').AstNode) {
    if (node.loc != null) {
      return [node.loc.start, node.loc.end];
    }
  },

  opensByDefault(node: import('regexp-tree/ast').AstNode, key: string) {
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
