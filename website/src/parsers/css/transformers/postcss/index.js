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

  loadTransformer(/** @type {(realTransformer: PostCSSTransformerModule) => void} */ callback) {
    require(['../../../transpilers/babel', 'postcss'], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {(plugins: Array<unknown>) => import('postcss').Processor} */ postcss) => {
      callback({ transpile: transpile.default, postcss });
    });
  },

  transform(/** @type {PostCSSTransformerModule} */ { transpile, postcss }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile( transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        require(/** @type {string} */ name) {
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
