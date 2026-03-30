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

  loadTransformer(callback: (realTransformer: {eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}) => void) {
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
      (eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform({ eslint, rules, sourceCode, utils }: {eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}, transformCode: string, code: string) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
