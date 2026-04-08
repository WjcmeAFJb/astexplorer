import compileModule from '../../../utils/compileModule';
import pkg from '@mdx-js/mdx/package.json';

const ID = 'mdx';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mdxjs.com',

  defaultParserID: 'mdxhast',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, mdx: {sync: (code: string, options: object) => string}, prettier: {format: (code: string, options: object) => string}, babel: object}) => void) {
    require([
      '../../../transpilers/babel',
      '@mdx-js/mdx',
      'prettier/standalone',
      'prettier/parser-babel',
    ], (transpile: {default: (code: string) => string}, mdx: {sync: (code: string, options: object) => string}, prettier: {format: (code: string, options: object) => string}, babel: object) => {
      callback({ transpile: transpile.default, mdx, prettier, babel });
    });
  },

  transform({ transpile, mdx, prettier, babel }: {transpile: (code: string) => string, mdx: {sync: (code: string, options: object) => string}, prettier: {format: (code: string, options: object) => string}, babel: object}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    const transform = compileModule(transformCode);
    const jsxCode = mdx.sync(code, {
      ...(transform.default || transform),
    });
    try {
      return prettier.format(jsxCode, {
        parser: 'babel',
        plugins: [babel],
      });
    } catch (err) {
      return `
${(err as Error).message}

------------
Full output:
------------

${jsxCode.trim()}
`.trim();
    }
  },
};
