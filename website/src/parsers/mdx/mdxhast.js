import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdxhast';

function removeNewlines(/** @type {ASTNode} */ node) {
  if (node.children != null) {
    node.children = node.children.filter((/** @type {ASTNode} */ node) => node.value !== '\n');
    node.children.forEach(removeNewlines);
  }
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mdxjs.com',
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@mdx-js/mdx', '@mdx-js/mdx/mdx-ast-to-mdx-hast'], (mdx, mdxAstToMdxHast) => callback({mdx, mdxAstToMdxHast}));
  },

  parse(/** @type {DynModule} */ {mdx, mdxAstToMdxHast}, /** @type {string} */ code) {
    let result;
    mdx.sync(code, {
      hastPlugins: [
        mdxAstToMdxHast,
        () => removeNewlines,
        () => (/** @type {ASTNode} */ tree) => {
          result = tree;
        },
      ],
    });

    return result;
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
