import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'handlebars',
  defaultParserID: 'glimmer',
  loadDeps(callback) {
    require(['@glimmer/syntax'], (glimmer: { preprocess: (code: string) => unknown; print: (ast: unknown) => string }) => {
      callback({ glimmer });
    });
  },
  parse(deps, code) {
    return (deps.glimmer as { preprocess: (code: string) => unknown }).preprocess(code);
  },
  codegen(deps, ast) {
    return (deps.glimmer as { print: (ast: unknown) => string }).print(ast);
  },
});
