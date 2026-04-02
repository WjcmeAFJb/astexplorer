import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'astexplorer-syn/package.json';
import {getWasmUrl} from '../wasm-config';

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
    require(['astexplorer-syn', 'astexplorer-syn/astexplorer_syn_bg.wasm'], async (syn: Record<string, unknown>, wasmModule: Record<string, unknown>) => {
      // astexplorer-syn is built for wasm-bindgen's "bundler" target, which expects
      // the bundler to handle WASM natively. But webpack 4 + file-loader gives the
      // _bg.js glue code a URL string instead of real WASM exports. We fix this by
      // manually fetching/instantiating the WASM binary and patching the module
      // exports object that _bg.js holds a reference to.
      const wasmBytes = await (await fetch(getWasmUrl('syn'))).arrayBuffer();

      // Collect the __wbg_*/__wbindgen_* glue functions that the WASM imports
      const importFuncs: Record<string, unknown> = {};
      for (const key of Object.keys(syn)) {
        if (key.startsWith('__wbg_') || key.startsWith('__wbindgen_')) {
          importFuncs[key] = syn[key];
        }
      }

      const { instance } = await WebAssembly.instantiate(
        wasmBytes,
        { './astexplorer_syn_bg.js': importFuncs },
      );

      // Patch the WASM module's exports object in-place. The _bg.js glue code
      // holds a reference to this same object (via webpack's module cache), so
      // its functions (parseFile, etc.) will now see real WASM exports.
      if (typeof wasmModule === 'object') {
        Object.assign(wasmModule, instance.exports);
      }

      callback(syn as unknown as typeof import('astexplorer-syn'));
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
