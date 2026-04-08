import { getParserByID } from '../index';
import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';

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
    ) {
      const transpile = realTransformer.transpile as (code: string) => string;
      const tg = realTransformer.treeGex as typeof import('tree-gex');
      const realParser = realTransformer.realParser;
      const parser = realTransformer.parser as { parse: (rp: unknown, code: string, opts: Record<string, unknown>) => unknown; getDefaultOptions: () => Record<string, unknown> };

      const ast = parser.parse(realParser, code, parser.getDefaultOptions());

      transformCode = transpile(transformCode);

      const mod = compileModule(transformCode, {
        ast,
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
      });
      const result = mod.__esModule ? (mod.default ?? mod) : mod;

      if (typeof result === 'string') return result;
      return JSON.stringify(result, null, 2);
    },
  };
}
