import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'glsl-parser/package.json';

const ID = 'glsl-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),
  _ignoredProperties: new Set([
    'loc', // we ignore the loc itself because it's actually a locally enhanced (not in the actual parser data)
    'parent', // it's pointless to display the parent node in the tree browser
    'stage', // same
  ]),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['glsl-tokenizer/string', 'glsl-parser/direct'], (
      tokenize,
      parse,
    ) => {
      callback({ tokenize, parse });
    });
  },

  parse(/** @type {DynModule} */ { tokenize, parse }, /** @type {string} */ code) {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    // the parser does not yet provide the "end" so this is a workaround https://github.com/stackgl/glsl-parser/issues/17
    function decoratePosition(/** @type {ASTNode} */ node, /** @type {ASTNode} */ end) {
      node.loc = {
        start: node.token.position || 0,
        end,
      };
      node.children.forEach((/** @type {ASTNode} */ child, /** @type {ASTNode} */ i) => {
        const nextSibling = node.children[i + 1];
        decoratePosition(
          child,
          nextSibling && nextSibling.token && 'position' in nextSibling.token
            ? nextSibling.token.position -
                (nextSibling.token.preceding || [])
                  .reduce((/** @type {ASTNode} */ s, /** @type {ASTNode} */ n) => s + (n.data || '').length, 0)
            : end,
        );
      });
    }
    decoratePosition(ast, code.length);
    return ast;
  },

  nodeToRange(/** @type {DynModule} */ { loc }) {
    if (loc) {
      return [loc.start, loc.end];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children' && node.type === '(program)';
  },
};
