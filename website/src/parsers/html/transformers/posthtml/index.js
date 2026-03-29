import compileModule from '../../../utils/compileModule';
import pkg from 'posthtml/package.json';

const ID = 'posthtml';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/posthtml/posthtml',

  defaultParserID: 'posthtml-parser',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, posthtml: () => {use: (plugin: unknown) => {process: (code: string, opts: object) => {html: string}}}}) => void} */ callback) {
    require(['../../../transpilers/babel', 'posthtml'], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {() => {use: (plugin: unknown) => {process: (code: string, opts: object) => {html: string}}}} */ posthtml) =>
      callback({ transpile: transpile.default, posthtml }));
  },

  transform(/** @type {{transpile: (code: string) => string, posthtml: () => {use: (plugin: unknown) => {process: (code: string, opts: object) => {html: string}}}}} */ { transpile, posthtml }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    // transpile with babel for es6+ support
    transformCode = transpile(transformCode);
    // compile to turn from string into a module
    let transform = compileModule(
      // eslint-disable-line no-shadow
      transformCode,
    );
    return posthtml()
      .use(transform.default || transform)
      .process(code, { sync: true }).html;
  },
};
