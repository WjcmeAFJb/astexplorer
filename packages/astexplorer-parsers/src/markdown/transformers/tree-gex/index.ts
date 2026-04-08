import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'markdown',
  defaultParserID: 'remark',
  loadDeps(callback) {
    require(['remark'], ({ remark }: { remark: typeof import('remark').remark }) => {
      callback({ remark });
    });
  },
  parse(deps, code) {
    return (deps.remark as typeof import('remark').remark)().parse(code);
  },
  codegen(deps, ast) {
    return String((deps.remark as typeof import('remark').remark)().stringify(ast));
  },
});
