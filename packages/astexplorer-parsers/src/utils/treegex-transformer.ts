import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';

type TreeGexConfig = {
  categoryId: string;
  defaultParserID: string;
  loadDeps: (callback: (deps: Record<string, unknown>) => void) => void;
  parse: (deps: Record<string, unknown>, code: string) => unknown;
  codegen?: (deps: Record<string, unknown>, ast: unknown, code: string) => string;
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
          callback({ transpile: transpile.default, treeGex, deps });
        });
      });
    },

    transform(
      realTransformer: Record<string, unknown>,
      transformCode: string,
      code: string,
    ) {
      const transpile = realTransformer.transpile as (code: string) => string;
      const tg = realTransformer.treeGex as typeof import('tree-gex');
      const deps = realTransformer.deps as Record<string, unknown>;

      const ast = config.parse(deps, code);

      // Transpile user's ES module code to CJS
      transformCode = transpile(transformCode);

      // User code has `ast` as a global and tree-gex via require('tree-gex').
      // User exports the result of calling tree-gex functions directly, e.g.:
      //   export default w.accumWalkMatch(ast, { ... })
      //   export default w.walkReplace(ast, { ... })
      const mod = compileModule(transformCode, {
        ast,
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
      });
      const result = mod.__esModule ? (mod.default ?? mod) : mod;

      // If result is a string, return it directly (codegen already done by user)
      if (typeof result === 'string') return result;

      // If codegen available and result looks like an AST, try to generate code
      if (config.codegen && result && typeof result === 'object') {
        try {
          return config.codegen(deps, result, code);
        } catch {
          // fall through to JSON
        }
      }

      return JSON.stringify(result, null, 2);
    },
  };
}
