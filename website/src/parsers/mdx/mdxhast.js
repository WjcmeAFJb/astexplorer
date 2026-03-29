import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdxhast';

function removeNewlines(/** @type {Record<string, unknown>} */ node) {
  if (node.children != null) {
    node.children = node.children.filter((/** @type {Record<string, unknown>} */ node) => node.value !== '\n');
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

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['@mdx-js/mdx', '@mdx-js/mdx/mdx-ast-to-mdx-hast'], (mdx, mdxAstToMdxHast) => callback({mdx, mdxAstToMdxHast}));
  },

  parse(/** @type {Record<string, Function>} */ {mdx, mdxAstToMdxHast}, /** @type {string} */ code) {
    let result;
    mdx.sync(code, {
      hastPlugins: [
        mdxAstToMdxHast,
        () => removeNewlines,
        () => (/** @type {Record<string, unknown>} */ tree) => {
          result = tree;
        },
      ],
    });

    return result;
  },

  nodeToRange(/** @type {Record<string, Function>} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },
};
