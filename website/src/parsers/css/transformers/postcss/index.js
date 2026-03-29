import compileModule from '../../../utils/compileModule';
import pkg from 'postcss/package.json';

const ID = 'postcss';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'postcss',

  loadTransformer(/** @type {*} */ callback) {
    require(['../../../transpilers/babel', 'postcss'], (transpile, postcss) => {
      callback({ transpile: transpile.default, postcss });
    });
  },

  transform(/** @type {*} */ { transpile, postcss }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    transformCode = transpile( transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        require(/** @type {*} */ name) {
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
