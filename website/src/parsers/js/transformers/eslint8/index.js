import pkg from 'eslint8/package.json';

const ID = 'eslint-v8';
const name = 'ESLint v8';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {(realTransformer: Record<string, any>) => void} */ callback) {
    require([
      'eslint8/lib/linter',
      'eslint8/lib/source-code',
      '../../utils/eslint4Utils',
    ], (/** @type {{Linter: new () => Record<string, unknown>}} */ Linter, /** @type {new (code: string, ast: unknown) => unknown} */ sourceCode, /** @type {typeof import('../../utils/eslint4Utils')} */ utils) =>
      callback({ eslint: new Linter.Linter(), sourceCode, utils }));
  },

  transform(/** @type {Record<string, any>} */ { eslint, sourceCode, utils }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    utils.defineRule(eslint, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
