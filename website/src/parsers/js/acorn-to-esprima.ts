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

  loadParser(callback: (realParser: unknown) => void) {
    require(['acorn-to-esprima', 'babel5'], (acornToEsprima: Record<string, unknown>, /** @type {{acorn: {tokTypes: unknown}, traverse: unknown, parse: (...args: unknown[]) => unknown}} */ {acorn: {tokTypes}, traverse, parse}) => {
      callback({
        ...acornToEsprima,
        tokTypes,
        traverse,
        parse,
      });
    });
  },

  parse(/** @type {{parse: (...args: unknown[]) => Record<string, unknown>, toTokens: (...args: unknown[]) => unknown[], convertComments: (...args: unknown[]) => void, attachComments: (...args: unknown[]) => void, toAST: (...args: unknown[]) => void, tokTypes: unknown, traverse: unknown}} */ parser, code: string) {
    const opts = {
      locations: true,
      ranges: true,
    };

    // @ts-expect-error — dynamic third-party API
    const /** @type {unknown[]} */ comments = opts.onComment = [];
    // @ts-expect-error — dynamic third-party API
    const /** @type {unknown[]} */ tokens = opts.onToken = [];

    let ast = parser.parse(code, opts);

    ast.tokens = parser.toTokens(tokens, parser.tokTypes, code);
    parser.convertComments(comments);
    ast.comments = comments;
    parser.attachComments(ast, comments, ast.tokens);
    parser.toAST(ast, parser.traverse);

    return ast;
  },

  nodeToRange(/** @type {{start?: number, end?: number, [key: string]: unknown}} */ node) {
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
