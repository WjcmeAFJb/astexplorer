import compileModule from '../../../utils/compileModule';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdx';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mdxjs.com',

  defaultParserID: 'mdxhast',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, mdx: {sync: (code: string, options: object) => string}, prettier: {format: (code: string, options: object) => string}, babel: object}) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      '@mdx-js/mdx',
      'prettier/standalone',
      'prettier/parser-babel',
    ], (/** @type {{default: (code: string) => string}} */ transpile, /** @type {{sync: (code: string, options: object) => string}} */ mdx, /** @type {{format: (code: string, options: object) => string}} */ prettier, /** @type {object} */ babel) => {
      callback({ transpile: transpile.default, mdx, prettier, babel });
    });
  },

  transform(/** @type {{transpile: (code: string) => string, mdx: {sync: (code: string, options: object) => string}, prettier: {format: (code: string, options: object) => string}, babylon: object}} */ { transpile, mdx, prettier, babylon }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    const transform = compileModule(transformCode);
    const jsxCode = mdx.sync(code, {
      ...(transform.default || transform),
    });
    try {
      return prettier.format(jsxCode, {
        parser: 'babylon',
        plugins: [babylon],
      });
    } catch (err) {
      return `
${/** @type {Error} */ (err).message}

------------
Full output:
------------

${jsxCode.trim()}
`.trim();
    }
  },
};
