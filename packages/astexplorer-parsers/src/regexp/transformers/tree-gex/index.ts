import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'regexp',
  defaultParserID: 'regexp-tree',
  loadDeps(callback) {
    require(['regexp-tree'], (regexpTree: { parse: (code: string) => unknown; generate: (ast: unknown) => string }) => {
      callback({ regexpTree });
    });
  },
  parse(deps, code) {
    return (deps.regexpTree as { parse: (code: string) => unknown }).parse(code);
  },
  codegen(deps, ast) {
    return (deps.regexpTree as { generate: (ast: unknown) => string }).generate(ast);
  },
});
