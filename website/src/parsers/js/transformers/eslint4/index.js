import pkg from 'eslint4/package.json';

const ID = 'eslint-v4';
const name = 'ESLint v4';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {(realTransformer: Record<string, any>) => void} */ callback) {
    require(
      [
        'eslint4/lib/linter',
        'eslint4/lib/util/source-code',
        '../../utils/eslint4Utils',
      ],
      (/** @type {new () => Record<string, unknown>} */ Linter, /** @type {new (code: string, ast: unknown) => unknown} */ sourceCode, /** @type {typeof import('../../utils/eslintUtils')} */ utils) => callback({eslint: new Linter(), sourceCode, utils}),
    );
  },

  transform(/** @type {Record<string, any>} */ { eslint, sourceCode, utils }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    utils.defineRule(eslint, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
