import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from 'acorn-to-esprima/package.json';

const ID = 'acorn-to-esprima';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc', 'start', 'end', 'range']),
  showInMenu: false,

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['acorn-to-esprima', 'babel5'], (/** @type {any} */ acornToEsprima, /** @type {any} */ {acorn: {tokTypes}, traverse, parse}) => {
      callback({
        ...acornToEsprima,
        tokTypes,
        traverse,
        parse,
      });
    });
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
    const opts = {
      locations: true,
      ranges: true,
    };

    // @ts-expect-error — dynamic third-party API
    const /** @type {any} */ comments = opts.onComment = [];
    // @ts-expect-error — dynamic third-party API
    const /** @type {any} */ tokens = opts.onToken = [];

    let ast = parser.parse(code, opts);

    ast.tokens = parser.toTokens(tokens, parser.tokTypes, code);
    parser.convertComments(comments);
    ast.comments = comments;
    parser.attachComments(ast, comments, ast.tokens);
    parser.toAST(ast, parser.traverse);

    return ast;
  },

  nodeToRange(/** @type {any} */ node) {
    if (typeof node.start !== 'undefined') {
      return [node.start, node.end];
    }
  },

  _ignoredProperties: new Set([
    '_paths',
    '_babelType',
    '__clone',
  ]),
};
