import compileModule from '../../../utils/compileModule';
import pkg from 'postcss/package.json';

/**
 * @typedef {{
 *   transpile: (code: string) => string,
 *   postcss: (plugins: Array<unknown>) => import('postcss').Processor,
 * }} PostCSSTransformerModule
 */

const ID = 'postcss';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'postcss',

  loadTransformer(callback: (realTransformer: PostCSSTransformerModule) => void) {
    require(['../../../transpilers/babel', 'postcss'], (/** @type {{default: (code: string) => string}} */ transpile, postcss: (plugins: Array<unknown>) => import('postcss').Processor) => {
      callback({ transpile: transpile.default, postcss });
    });
  },

  transform(/** @type {PostCSSTransformerModule} */ { transpile, postcss }, transformCode: string, code: string) {
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
