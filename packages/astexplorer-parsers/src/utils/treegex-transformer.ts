import { getParserByID } from '../index';
import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';
import {
  buildCursorRewrite,
  extractCursorCaptures,
  CURSOR_WRAP_GLOBAL,
  CURSOR_MATCHES_NAME,
} from './treegex-cursor-capture';

type TreeGexConfig = {
  categoryId: string;
  defaultParserID: string;
  loadDeps: (callback: (deps: Record<string, unknown>) => void) => void;
  parse: (deps: Record<string, unknown>, code: string) => unknown;
  codegen?: (deps: Record<string, unknown>, ast: unknown, code: string) => string;
};

export type TreeGexTransformResult = {
  code: string;
  cursorNodes: unknown[];
};

type ParserLike = {
  parse: (rp: unknown, code: string, opts: Record<string, unknown>) => unknown;
  getDefaultOptions: () => Record<string, unknown>;
  _promise?: Promise<unknown>;
  loadParser: (cb: (realParser: unknown) => void) => void;
};

export default function createTreeGexTransformer(config: TreeGexConfig) {
  return {
    id: 'tree-gex-' + config.categoryId,
    displayName: 'tree-gex',
    version: treeGexPkg.version,
    homepage: 'https://github.com/d7sd6u/tree-gex',

    defaultParserID: config.defaultParserID,

    loadTransformer(callback: (realTransformer: unknown) => void) {
      require(['../transpilers/babel', 'tree-gex'], (transpile: {default: (code: string) => string}, treeGex: Record<string, unknown>) => {
        config.loadDeps((deps: Record<string, unknown>) => {
          // Also preload the default parser so cursor-capture can re-parse
          // with the SAME parser that the AST view uses (so node references
          // match and highlighting works).
          const parser = getParserByID(config.defaultParserID) as ParserLike | undefined;
          if (parser) {
            parser._promise ??= new Promise(parser.loadParser);
            parser._promise.then((realParser: unknown) => {
              callback({ transpile: transpile.default, treeGex, deps, realParser, parser });
            });
          } else {
            callback({ transpile: transpile.default, treeGex, deps });
          }
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
      const deps = realTransformer.deps as Record<string, unknown>;
      const realParser = realTransformer.realParser;
      const parser = realTransformer.parser as ParserLike | undefined;

      const userAst = config.parse(deps, code);

      const cursorWrap = (pattern: unknown) =>
        (tg as unknown as { group: (p: unknown, name: string) => unknown }).group(
          pattern,
          '__astexplorerCursorCapture__',
        );

      // 1. Execute user's original code with the transformer's own AST (the
      //    one the user expects — e.g., recast's AST for JS so walkReplace
      //    can print back to source).
      const transpiledUser = transpile(transformCode);
      const userMod = compileModule(transpiledUser, {
        ast: userAst,
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
      });
      const userResult = userMod.__esModule ? (userMod.default ?? userMod) : userMod;
      const output = finalizeOutput(userResult, config, deps, code);

      // 2. Cursor-capture: run an instrumented copy of the user's module
      //    against the PARSER'S AST (matching the AST view), so captured
      //    node references align with what's rendered for highlighting.
      let cursorNodes: unknown[] = [];
      if (typeof cursor === 'number' && parser && realParser) {
        const rewrite = buildCursorRewrite(transformCode, cursor);
        if (rewrite) {
          try {
            const parserAst = parser.parse(realParser, code, parser.getDefaultOptions());
            const transpiledCursor = transpile(rewrite.code);
            const cursorMod = compileModule(transpiledCursor, {
              ast: parserAst,
              require(name: string) {
                if (name === 'tree-gex') return tg;
                throw new Error(`Cannot find module '${name}'`);
              },
              [CURSOR_WRAP_GLOBAL]: cursorWrap,
            });
            const matches = (cursorMod as Record<string, unknown>)[CURSOR_MATCHES_NAME];
            cursorNodes = extractCursorCaptures(matches).map((c) => c.value);
          } catch {
            // Instrumentation is best-effort; swallow errors so highlighting
            // simply doesn't appear if the cursor rewrite produces broken code.
            cursorNodes = [];
          }
        }
      }

      if (cursorNodes.length > 0) {
        return { code: output, cursorNodes };
      }
      return output;
    },
  };
}

function finalizeOutput(
  result: unknown,
  config: TreeGexConfig,
  deps: Record<string, unknown>,
  code: string,
): string {
  if (typeof result === 'string') return result;
  if (
    config.codegen &&
    result !== null &&
    result !== undefined &&
    typeof result === 'object' &&
    !Array.isArray(result)
  ) {
    try {
      const generated = config.codegen(deps, result, code);
      if (generated) return generated;
    } catch {
      // fall through to JSON
    }
  }
  return JSON.stringify(result, null, 2);
}
