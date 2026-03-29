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

  loadTransformer(/** @type {(realTransformer: {eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}) => void} */ callback) {
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
      (/** @type {{verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}} */ eslint, /** @type {new (code: string, ast: unknown) => unknown} */ sourceCode, /** @type {{define: (name: string, rule: unknown) => void}} */ rules, /** @type {typeof import('../../utils/eslintUtils')} */ utils) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform(/** @type {{eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}} */ { eslint, rules, sourceCode, utils }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
