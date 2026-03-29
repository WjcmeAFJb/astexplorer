import compileModule from '../../../utils/compileModule';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdx';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mdxjs.com',

  defaultParserID: 'mdxhast',

  loadTransformer(/** @type {(realTransformer: Record<string, any>) => void} */ callback) {
    require([
      '../../../transpilers/babel',
      '@mdx-js/mdx',
      'prettier/standalone',
      'prettier/parser-babel',
    ], (/** @type {any} */ transpile, /** @type {any} */ mdx, /** @type {any} */ prettier, /** @type {any} */ babel) => {
      callback({ transpile: transpile.default, mdx, prettier, babel });
    });
  },

  transform(/** @type {Record<string, any>} */ { transpile, mdx, prettier, babylon }, /** @type {string} */ transformCode, /** @type {string} */ code) {
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
${err.message}

------------
Full output:
------------

${jsxCode.trim()}
`.trim();
    }
  },
};
