import {configureWasm} from 'astexplorer-parsers';
import swcWasm from 'astexplorer-parsers/swc.wasm';
import synWasm from 'astexplorer-parsers/syn.wasm';
import goWasm from 'astexplorer-parsers/go.wasm';
import monkeyWasm from 'astexplorer-parsers/monkey.wasm';

export function initWasm(): void {
  configureWasm({ swc: String(swcWasm), syn: String(synWasm), go: String(goWasm), monkey: String(monkeyWasm) });
}
