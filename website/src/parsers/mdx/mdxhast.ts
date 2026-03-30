import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdxhast';

function removeNewlines(/** @type {{children?: {value?: string}[], [key: string]: unknown}} */ node) {
  if (node.children != null) {
    node.children = node.children.filter((/** @type {{value?: string}} */ node) => node.value !== '\n');
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

  loadParser(callback: (realParser: unknown) => void) {
    require(['@mdx-js/mdx', '@mdx-js/mdx/mdx-ast-to-mdx-hast'], (/** @type {{sync: (code: string, options: object) => unknown}} */ mdx, mdxAstToMdxHast: unknown) => callback({mdx, mdxAstToMdxHast}));
  },

  parse(/** @type {{mdx: {sync: (code: string, options: object) => unknown}, mdxAstToMdxHast: unknown}} */ {mdx, mdxAstToMdxHast}, code: string) {
    let result;
    mdx.sync(code, {
      hastPlugins: [
        mdxAstToMdxHast,
        () => removeNewlines,
        () => (tree: Record<string, unknown>) => {
          result = tree;
        },
      ],
    });

    return result;
  },

  nodeToRange(/** @type {{position?: {start: {offset: number}, end: {offset: number}}, [key: string]: unknown}} */ { position }) {
    if (position) {
      return [position.start.offset, position.end.offset];
    }
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return key === 'children';
  },
};
