import { getParserByID } from '../index';
import compileModule from './compileModule';
import treeGexPkg from 'tree-gex/package.json';

/**
 * Creates a tree-gex transformer that uses the parsers registry to load
 * and invoke the parser. This is for categories without codegen — the
 * output is always JSON showing matched nodes and captured groups.
 */
export default function createGenericTreeGexTransformer(defaultParserID: string) {
  return {
    id: 'tree-gex',
    displayName: 'tree-gex',
    version: treeGexPkg.version,
    homepage: 'https://github.com/d7sd6u/tree-gex',

    defaultParserID,

    loadTransformer(callback: (realTransformer: unknown) => void) {
      require(['tree-gex'], (treeGex: Record<string, unknown>) => {
        const parser = getParserByID(defaultParserID);
        parser._promise ??= new Promise(parser.loadParser);
        parser._promise.then((realParser: unknown) => {
          callback({ treeGex, realParser, parser });
        });
      });
    },

    transform(
      realTransformer: Record<string, unknown>,
      transformCode: string,
      code: string,
    ) {
      const tg = realTransformer.treeGex as typeof import('tree-gex');
      const realParser = realTransformer.realParser;
      const parser = realTransformer.parser as { parse: (realParser: unknown, code: string, options: Record<string, unknown>) => unknown; getDefaultOptions: () => Record<string, unknown> };

      const mod = compileModule(transformCode, {
        require(name: string) {
          if (name === 'tree-gex') return tg;
          throw new Error(`Cannot find module '${name}'`);
        },
      });
      const userExport = mod.__esModule ? (mod.default || mod) : mod;
      const pattern = (userExport as Record<string, unknown>).pattern ?? userExport;

      const ast = parser.parse(realParser, code, parser.getDefaultOptions());
      const matches = tg.accumWalkMatch(ast, pattern);

      return JSON.stringify(matches, null, 2);
    },
  };
}
