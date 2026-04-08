import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'javascript',
  defaultParserID: 'acorn',
  loadDeps(callback) {
    require(['recast'], (recast: typeof import('recast')) => {
      callback({ recast });
    });
  },
  parse(deps, code) {
    return (deps.recast as typeof import('recast')).parse(code);
  },
  codegen(deps, ast) {
    return (deps.recast as typeof import('recast')).print(ast).code;
  },
});
