import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';

type TreeGexConfig = {
  defaultParserID: string;
  loadDeps: (callback: (deps: Record<string, unknown>) => void) => void;
  parse: (deps: Record<string, unknown>, code: string) => unknown;
  codegen?: (deps: Record<string, unknown>, ast: unknown, code: string) => string;
};

export default function createTreeGexTransformer(config: TreeGexConfig) {
  return {
    id: 'tree-gex',
    displayName: 'tree-gex',
    version: treeGexPkg.version,
    homepage: 'https://github.com/d7sd6u/tree-gex',

    defaultParserID: config.defaultParserID,

    loadTransformer(callback: (realTransformer: unknown) => void) {
      require(['tree-gex'], (treeGex: Record<string, unknown>) => {
        config.loadDeps((deps: Record<string, unknown>) => {
          callback({ treeGex, deps });
        });
      });
    },

    transform(
      realTransformer: Record<string, unknown>,
      transformCode: string,
      code: string,
    ) {
      const tg = realTransformer.treeGex as typeof import('tree-gex');
      const deps = realTransformer.deps as Record<string, unknown>;

      // User code exports: { pattern } or a pattern object directly
      // Sandbox provides `require('tree-gex')`
      const mod = compileModule(transformCode, {
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
      });
      const userExport = mod.__esModule ? (mod.default || mod) : mod;
      const pattern = (userExport as Record<string, unknown>).pattern ?? userExport;

      const ast = config.parse(deps, code);

      // Collect matches
      const matches = tg.accumWalkMatch(ast, pattern);

      // If codegen is available, try walkReplace to produce transformed code
      if (config.codegen) {
        try {
          const transformed = tg.walkReplace(ast, pattern);
          if (transformed !== ast) {
            const output = config.codegen(deps, transformed, code);
            return JSON.stringify({ matches, output }, null, 2);
          }
        } catch {
          // Codegen failed — fall through to JSON-only output
        }
      }

      return JSON.stringify(matches, null, 2);
    },
  };
}
