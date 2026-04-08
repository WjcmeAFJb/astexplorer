import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'css',
  defaultParserID: 'postcss',
  loadDeps(callback) {
    require(['postcss'], (postcss: unknown) => {
      callback({ postcss });
    });
  },
  parse(deps, code) {
    return (deps.postcss as { parse: (code: string) => unknown }).parse(code);
  },
  codegen(deps, ast) {
    return String((ast as { toResult: () => { css: string } }).toResult().css);
  },
});
