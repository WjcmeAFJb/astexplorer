import { getParserByID } from '../index';
import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';
import {
  buildCursorRewrite,
  extractCursorCaptures,
  CURSOR_WRAP_GLOBAL,
  CURSOR_MATCHES_NAME,
} from './treegex-cursor-capture';
import type { TreeGexTransformResult } from './treegex-transformer';

/**
 * Creates a tree-gex transformer that uses the parsers registry to parse code.
 * The parsed AST is passed as a global `ast` variable to the user's code.
 * User code calls tree-gex functions directly and exports the result.
 */
export default function createGenericTreeGexTransformer(categoryId: string, defaultParserID: string) {
  return {
    id: 'tree-gex-' + categoryId,
    displayName: 'tree-gex',
    version: treeGexPkg.version,
    homepage: 'https://github.com/d7sd6u/tree-gex',

    defaultParserID,

    loadTransformer(callback: (realTransformer: unknown) => void) {
      require(['../transpilers/babel', 'tree-gex'], (transpile: {default: (code: string) => string}, treeGex: Record<string, unknown>) => {
        const parser = getParserByID(defaultParserID);
        parser._promise ??= new Promise(parser.loadParser);
        parser._promise.then((realParser: unknown) => {
          callback({ transpile: transpile.default, treeGex, realParser, parser });
        });
      });
    },

    transform(
      realTransformer: Record<string, unknown>,
      transformCode: string,
      code: string,
      cursor?: number,
    ): string | TreeGexTransformResult {
      const transpile = realTransformer.transpile as (code: string) => string;
      const tg = realTransformer.treeGex as typeof import('tree-gex');
      const realParser = realTransformer.realParser;
      const parser = realTransformer.parser as { parse: (rp: unknown, code: string, opts: Record<string, unknown>) => unknown; getDefaultOptions: () => Record<string, unknown> };

      const ast = parser.parse(realParser, code, parser.getDefaultOptions());

      let sourceToRun = transformCode;
      let cursorActive = false;
      if (typeof cursor === 'number') {
        const rewrite = buildCursorRewrite(transformCode, cursor);
        if (rewrite) {
          try {
            transpile(rewrite.code);
            sourceToRun = rewrite.code;
            cursorActive = true;
          } catch {
            cursorActive = false;
          }
        }
      }

      const transpiled = transpile(sourceToRun);
      const cursorWrap = (pattern: unknown) =>
        (tg as unknown as { group: (p: unknown, name: string) => unknown }).group(
          pattern,
          '__astexplorerCursorCapture__',
        );

      const mod = compileModule(transpiled, {
        ast,
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
        [CURSOR_WRAP_GLOBAL]: cursorWrap,
      });
      const result = mod.__esModule ? (mod.default ?? mod) : mod;

      let cursorNodes: unknown[] = [];
      if (cursorActive) {
        const matches = (mod as Record<string, unknown>)[CURSOR_MATCHES_NAME];
        cursorNodes = extractCursorCaptures(matches).map((c) => c.value);
      }

      const output = typeof result === 'string' ? result : JSON.stringify(result, null, 2);

      if (cursorActive) {
        return { code: output, cursorNodes };
      }
      return output;
    },
  };
}
