import pkg from 'eslint2/package.json';

const ID = 'eslint-v2';
const name = 'ESLint v2'

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: false,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {(realTransformer: DynModule) => void} */ callback) {
    require(
      [
        // Explicitly require just the stuff we care about to avoid loading
        // RuleTester and CLIEngine, which are unnecessary and bloat out the
        // package size.
        'eslint2/lib/eslint',
        'eslint2/lib/util/source-code',
        'eslint2/lib/rules',
        '../../utils/eslintUtils',
      ],
      (eslint, sourceCode, rules, utils) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform(/** @type {DynModule} */ { eslint, rules, sourceCode, utils }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
