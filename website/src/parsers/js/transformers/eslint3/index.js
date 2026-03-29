import pkg from 'eslint3/package.json';

const ID = 'eslint-v3';
const name = 'ESLint v3'

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: false,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {*} */ callback) {
    require(
      [
        // Explicitly require just the stuff we care about to avoid loading
        // RuleTester and CLIEngine, which are unnecessary and bloat out the
        // package size.
        'eslint3/lib/eslint',
        'eslint3/lib/util/source-code',
        'eslint3/lib/rules',
        '../../utils/eslintUtils',
      ],
      (eslint, sourceCode, rules, utils) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform(/** @type {*} */ { eslint, rules, sourceCode, utils }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
