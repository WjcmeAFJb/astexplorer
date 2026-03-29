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

  loadParser(/** @type {*} */ callback) {
    require(['glsl-tokenizer/string', 'glsl-parser/direct'], (
      tokenize,
      parse,
    ) => {
      callback({ tokenize, parse });
    });
  },

  parse(/** @type {*} */ { tokenize, parse }, /** @type {*} */ code) {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    // the parser does not yet provide the "end" so this is a workaround https://github.com/stackgl/glsl-parser/issues/17
    function decoratePosition(/** @type {*} */ node, /** @type {*} */ end) {
      node.loc = {
        start: node.token.position || 0,
        end,
      };
      node.children.forEach((/** @type {*} */ child, /** @type {*} */ i) => {
        const nextSibling = node.children[i + 1];
        decoratePosition(
          child,
          nextSibling && nextSibling.token && 'position' in nextSibling.token
            ? nextSibling.token.position -
                (nextSibling.token.preceding || [])
                  .reduce((/** @type {*} */ s, /** @type {*} */ n) => s + (n.data || '').length, 0)
            : end,
        );
      });
    }
    decoratePosition(ast, code.length);
    return ast;
  },

  nodeToRange(/** @type {*} */ { loc }) {
    if (loc) {
      return [loc.start, loc.end];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'children' && node.type === '(program)';
  },
};
