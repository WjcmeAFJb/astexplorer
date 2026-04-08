import createTreeGexTransformer from '../../../utils/treegex-transformer';

export default createTreeGexTransformer({
  categoryId: 'htmlmixed',
  defaultParserID: 'htmlparser2',
  loadDeps(callback) {
    require(['posthtml-parser', 'posthtml'], (parser: { default: (html: string) => unknown }, posthtml: { default: (plugins?: unknown[]) => { process: (html: string, opts?: object) => { html: string } } }) => {
      callback({ parser: parser.default || parser, posthtml: posthtml.default || posthtml });
    });
  },
  parse(deps, code) {
    return (deps.parser as (html: string) => unknown)(code);
  },
  codegen(deps, ast, code) {
    const posthtml = deps.posthtml as (plugins?: unknown[]) => { process: (html: string, opts?: object) => { html: string } };
    return posthtml([() => ast]).process(code, { sync: true }).html;
  },
});
