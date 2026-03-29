import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdxhast';

function removeNewlines(/** @type {any} */ node) {
  if (node.children != null) {
    node.children = node.children.filter((/** @type {any} */ node) => node.value !== '\n');
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

  loadParser(/** @type {(realParser: any) => void} */ callback) {
    require(['@mdx-js/mdx', '@mdx-js/mdx/mdx-ast-to-mdx-hast'], (mdx, mdxAstToMdxHast) => callback({mdx, mdxAstToMdxHast}));
  },

  parse(/** @type {any} */ {mdx, mdxAstToMdxHast}, /** @type {string} */ code) {
    let result;
    mdx.sync(code, {
      hastPlugins: [
        mdxAstToMdxHast,
        () => removeNewlines,
        () => (/** @type {any} */ tree) => {
          result = tree;
        },
      ],
    });

    return result;
  },

  nodeToRange(/** @type {any} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {any} */ node, /** @type {string} */ key) {
    return key === 'children';
  },
};
