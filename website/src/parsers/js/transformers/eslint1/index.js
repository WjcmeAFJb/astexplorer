import pkg from 'eslint1/package.json';

const ID = 'eslint-v1';
const name = 'ESLint v1'

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: false,

  defaultParserID: 'acorn-to-esprima',

  loadTransformer(/** @type {*} */ callback) {
    require(
      [
        // Explicitly require just the stuff we care about to avoid loading
        // RuleTester and CLIEngine, which are unnecessary and bloat out the
        // package size.
        'eslint1/lib/eslint',
        'eslint1/lib/util/source-code',
        'eslint1/lib/rules',
        '../../utils/eslintUtils',
      ],
      (eslint, sourceCode, rules, utils) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform(/** @type {*} */ { eslint, sourceCode, rules, utils }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
