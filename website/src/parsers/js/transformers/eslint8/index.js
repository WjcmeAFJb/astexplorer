import pkg from 'eslint8/package.json';

const ID = 'eslint-v8';
const name = 'ESLint v8';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {(realTransformer: DynModule) => void} */ callback) {
    require([
      'eslint8/lib/linter',
      'eslint8/lib/source-code',
      '../../utils/eslint4Utils',
    ], (Linter, sourceCode, utils) =>
      callback({ eslint: new Linter.Linter(), sourceCode, utils }));
  },

  transform(/** @type {DynModule} */ { eslint, sourceCode, utils }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    utils.defineRule(eslint, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
