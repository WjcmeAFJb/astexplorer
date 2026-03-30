import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'htmlparser2/package.json';

/** @typedef {import('domhandler').Node & { startIndex: number, endIndex: number, name?: string }} HtmlParser2Node */
/** @typedef {{ Parser: { Parser: new (handler: unknown, options?: object) => { end(code: string): void } }, Handler: new () => { root: HtmlParser2Node, parser: { endIndex: number, tokenizer: { _index: number } } } }} HtmlParser2Module */

const ID = 'htmlparser2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/fb55/htmlparser2',
  locationProps: new Set(['startIndex', 'endIndex']),
  typeProps: new Set(['type', 'name']),

  loadParser(/** @type {(realParser: HtmlParser2Module) => void} */ callback) {
    require(['htmlparser2/lib/Parser', 'domhandler'], (/** @type {{Parser: new (handler: unknown, options?: object) => {end(code: string): void}}} */ Parser, /** @type {{DomHandler: new (options: object) => {root: HtmlParser2Node, parser: {endIndex: number, tokenizer: {_index: number}}, onprocessinginstruction(name: string, data: string): void}}} */ {DomHandler}) => {
      class Handler extends DomHandler {
        constructor() {
          super({ withStartIndices: true, withEndIndices: true });
        }

        // It appears that htmlparser2 doesn't correctly process
        // ProcessingInstructions. Their "endIndex" isn't set properly.
        onprocessinginstruction(/** @type {string} */ name, /** @type {string} */ data) {
          this.parser.endIndex = this.parser.tokenizer._index;
          super.onprocessinginstruction(name, data);
        }

      }

      callback(/** @type {HtmlParser2Module} */ ({ Parser, Handler }));
    });
  },

  parse(/** @type {HtmlParser2Module} */ { Parser: {Parser}, Handler }, /** @type {string} */ code, /** @type {import('htmlparser2').ParserOptions} */ options) {
    let handler = new Handler();
    new Parser(handler, options).end(code);
    return handler.root;
  },

  nodeToRange(/** @type {HtmlParser2Node} */ node) {
    if (node.type) {
      return [node.startIndex, node.endIndex+1];
    }
  },

  opensByDefault(/** @type {HtmlParser2Node} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {HtmlParser2Node} */ node) {
    /** @type {string | undefined} */
    let nodeName = node.type;
    if (nodeName && node.name) {
      nodeName += `(${node.name})`;
    }
    return nodeName;
  },

  getDefaultOptions() {
    return {
      xmlMode: false,
      lowerCaseAttributeNames: true,
      lowerCaseTags: true,
    };
  },

  _ignoredProperties: new Set(['prev', 'next', 'parent', 'parentNode']),
};
