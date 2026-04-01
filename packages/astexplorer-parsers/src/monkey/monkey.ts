import pkg from '@gengjiawen/monkey-wasm/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

const ID = 'monkey'

interface MonkeyParser {
  parse(input: string): string;
}

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://monkeylang.org/',
  locationProps: new Set(['span']),

  loadParser(callback: (realParser: MonkeyParser) => void) {
    // Load the WASM file URL (emitted by file-loader) then fetch + instantiate it.
    // We can't use the default monkey_wasm.js entry because webpack's built-in WASM
    // handling (ReadFileCompileWasmPlugin for target:'node') doesn't work in the browser.
    require(
      ['@gengjiawen/monkey-wasm/monkey_wasm_bg.wasm'],
      (wasmUrl: { default: string } | string) => {
        const url = typeof wasmUrl === 'string' ? wasmUrl : wasmUrl.default;

        // Inline the text encode/decode helpers from monkey_wasm_bg.js
        const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        const encoder = new TextEncoder();
        let mem8: Uint8Array | null = null;
        let mem32: Int32Array | null = null;
        let WASM_VECTOR_LEN = 0;
        let wasm: WebAssembly.Exports;

        function getUint8Memory() {
          if (!mem8 || mem8.buffer !== (wasm.memory as WebAssembly.Memory).buffer) {
            mem8 = new Uint8Array((wasm.memory as WebAssembly.Memory).buffer);
          }
          return mem8;
        }
        function getInt32Memory() {
          if (!mem32 || mem32.buffer !== (wasm.memory as WebAssembly.Memory).buffer) {
            mem32 = new Int32Array((wasm.memory as WebAssembly.Memory).buffer);
          }
          return mem32;
        }
        function getStringFromWasm(ptr: number, len: number) {
          return decoder.decode(getUint8Memory().subarray(ptr, ptr + len));
        }
        function passStringToWasm(arg: string, malloc: Function, realloc: Function) {
          const buf = encoder.encode(arg);
          const ptr = (malloc as (len: number) => number)(buf.length);
          getUint8Memory().subarray(ptr, ptr + buf.length).set(buf);
          WASM_VECTOR_LEN = buf.length;
          return ptr;
        }

        const imports = {
          './monkey_wasm_bg.js': {
            __wbindgen_throw(arg0: number, arg1: number) {
              throw new Error(getStringFromWasm(arg0, arg1));
            },
          },
        };

        fetch(url)
          .then(r => r.arrayBuffer())
          .then(bytes => WebAssembly.instantiate(bytes, imports))
          .then(result => {
            wasm = result.instance.exports;
            const parser: MonkeyParser = {
              parse(input: string): string {
                const retptr = (wasm.__wbindgen_add_to_stack_pointer as Function)(-16);
                try {
                  const ptr0 = passStringToWasm(input, wasm.__wbindgen_malloc as Function, wasm.__wbindgen_realloc as Function);
                  const len0 = WASM_VECTOR_LEN;
                  (wasm.parse as Function)(retptr, ptr0, len0);
                  const r0 = getInt32Memory()[retptr / 4 + 0];
                  const r1 = getInt32Memory()[retptr / 4 + 1];
                  return getStringFromWasm(r0, r1);
                } finally {
                  (wasm.__wbindgen_add_to_stack_pointer as Function)(16);
                  // Note: wasm.__wbindgen_free is called by the original but
                  // the return string is already copied by getStringFromWasm
                }
              },
            };
            callback(parser);
          });
      },
    );
  },

  parse(parser: MonkeyParser, code: string) {
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
