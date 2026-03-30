import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'astexplorer-syn/package.json';

type LineOffsetsMixin = {lineOffsets: number[]};

const ID = 'syn';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: `https://docs.rs/syn/${pkg.version}/syn/`,
  _ignoredProperties: new Set(['_type']),
  locationProps: new Set(['span']),

  loadParser(callback: (realParser: typeof import('astexplorer-syn')) => void) {
    require(['astexplorer-syn', 'astexplorer-syn/astexplorer_syn_bg.wasm'], async (syn: typeof import('astexplorer-syn'), wasmModule: {default: string}) => {
      await syn.default(wasmModule.default);
      callback(syn);
    });
  },

  parse(this: LineOffsetsMixin, parser: typeof import('astexplorer-syn'), code: string) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while ((index = code.indexOf('\n', index) + 1)); // eslint-disable-line no-cond-assign
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- parseFile() is typed as returning any in its .d.ts
    return parser.parseFile(code);
  },

  getNodeName(node: {_type?: string}) {
    return node._type;
  },

  nodeToRange(this: LineOffsetsMixin, node: {span?: {start: {line: number, column: number}, end: {line: number, column: number}}, [key: string]: unknown}) {
    if (node.span) {
      return [node.span.start, node.span.end].map(
        ({ line, column }) => this.lineOffsets[line - 1] + column,
      );
    }
  },
};
