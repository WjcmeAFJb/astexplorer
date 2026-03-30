import compileModule from '../../../utils/compileModule';
import pkg from 'postcss/package.json';

type PostCSSTransformerModule = { transpile: (code: string) => string, postcss: (plugins: Array<unknown>) => import('postcss').Processor, };

const ID = 'postcss';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'postcss',

  loadTransformer(callback: (realTransformer: PostCSSTransformerModule) => void) {
    require(['../../../transpilers/babel', 'postcss'], (transpile: {default: (code: string) => string}, postcss: (plugins: Array<unknown>) => import('postcss').Processor) => {
      callback({ transpile: transpile.default, postcss });
    });
  },

  transform({ transpile, postcss }: PostCSSTransformerModule, transformCode: string, code: string) {
    transformCode = transpile( transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        require(name: string) {
          switch (name) {
            case 'postcss': return postcss;
            default: throw new Error(`Cannot find module '${name}'`);
          }
        },
      },
    );
    return postcss([ (transform.default || transform)() ]).process(code).css;
  },
};
