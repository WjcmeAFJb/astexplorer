import pkg from '@gengjiawen/monkey-wasm/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

type MonkeyModule = typeof import('@gengjiawen/monkey-wasm');

const ID = 'monkey'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://monkeylang.org/',
  locationProps: new Set(['span']),

  async loadParser(callback: (realParser: MonkeyModule) => void) {
    require(['@gengjiawen/monkey-wasm/monkey_wasm.js'], callback);
  },

  parse(parser: MonkeyModule, code: string) {
    try {
      return (JSON.parse(parser.parse(code)) as {type?: string, span?: {start: number, end: number}});
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError((message as string));
    }
  },

  getNodeName(node: {type?: string}) {
    return node.type
  },

  nodeToRange(node: {span?: {start: number, end: number}, [key: string]: unknown}) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },
}
