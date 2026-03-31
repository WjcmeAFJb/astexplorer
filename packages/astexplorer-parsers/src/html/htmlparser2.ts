import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'htmlparser2/package.json';
type HtmlParser2Node = import('domhandler').Node;

type HtmlParser2Module = { Parser: { Parser: new (handler: unknown, options?: object) => { end(code: string): void } }, Handler: new () => { root: HtmlParser2Node, parser: { endIndex: number, tokenizer: { _index: number } } } };

const ID = 'htmlparser2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/fb55/htmlparser2',
  locationProps: new Set(['startIndex', 'endIndex']),
  typeProps: new Set(['type', 'name']),

  loadParser(callback: (realParser: HtmlParser2Module) => void) {
    require(['htmlparser2/lib/Parser', 'domhandler'], (Parser: {Parser: new (handler: unknown, options?: object) => {end(code: string): void}}, {DomHandler}: {DomHandler: new (options: object) => {root: HtmlParser2Node, parser: {endIndex: number, tokenizer: {_index: number}}, onprocessinginstruction(name: string, data: string): void}}) => {
      class Handler extends DomHandler {
        constructor() {
          super({ withStartIndices: true, withEndIndices: true });
        }

        // It appears that htmlparser2 doesn't correctly process
        // ProcessingInstructions. Their "endIndex" isn't set properly.
        onprocessinginstruction(name: string, data: string) {
          this.parser.endIndex = this.parser.tokenizer._index;
          super.onprocessinginstruction(name, data);
        }

      }

      callback(({ Parser, Handler } as HtmlParser2Module));
    });
  },

  parse({ Parser: {Parser}, Handler }: HtmlParser2Module, code: string, options: import('htmlparser2').ParserOptions) {
    let handler = new Handler();
    new Parser(handler, options).end(code);
    return handler.root;
  },

  nodeToRange(node: HtmlParser2Node) {
    if (node.type) {
      return [node.startIndex, node.endIndex+1];
    }
  },

  opensByDefault(node: HtmlParser2Node, key: string) {
    return key === 'children';
  },

  getNodeName(node: HtmlParser2Node) {
        let nodeName: string | undefined = node.type;
    if (nodeName && (node as any).name) {
      nodeName += `(${(node as any).name})`;
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
