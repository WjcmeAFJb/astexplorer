import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'htmlparser2/package.json';

/** @typedef {import('domhandler').AnyNode & { startIndex: number, endIndex: number }} HtmlParser2Node */
/** @typedef {{ Parser: { Parser: new (handler: InstanceType<DomHandlerCtor>, options?: object) => { end(code: string): void } }, Handler: DomHandlerCtor }} HtmlParser2Module */
/** @typedef {new () => import('domhandler').DomHandler & { root: HtmlParser2Node, parser: { endIndex: number, tokenizer: { _index: number } } }} DomHandlerCtor */

const ID = 'htmlparser2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/fb55/htmlparser2',
  locationProps: new Set(['startIndex', 'endIndex']),
  typeProps: new Set(['type', 'name']),

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['htmlparser2/lib/Parser', 'domhandler'], (Parser, {DomHandler}) => {
      class Handler extends DomHandler {
        constructor() {
          super({ withStartIndices: true, withEndIndices: true });
        }

        // It appears that htmlparser2 doesn't correctly process
        // ProcessingInstructions. Their "endIndex" isn't set properly.
        onprocessinginstruction(/** @type {string} */ name, /** @type {Record<string, unknown>} */ data) {
          this.parser.endIndex = this.parser.tokenizer._index;
          super.onprocessinginstruction(name, data);
        }

      }

      callback({ Parser, Handler });
    });
  },

  parse(/** @type {Record<string, Function>} */ { Parser: {Parser}, Handler }, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    let handler = new Handler();
    new Parser(handler, options).end(code);
    return handler.root;
  },

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
    if (node.type) {
      return [node.startIndex, node.endIndex+1];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
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
