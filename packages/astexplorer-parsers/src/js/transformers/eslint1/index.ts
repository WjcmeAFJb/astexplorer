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

  loadTransformer(callback: (realTransformer: {eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}) => void) {
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
      (eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')) => callback({eslint, sourceCode, rules, utils}),
    );
  },

  transform({ eslint, sourceCode, rules, utils }: {eslint: {verify: (source: unknown, config: object) => Array<{message: string, line: number, column: number, source?: string}>}, sourceCode: new (code: string, ast: unknown) => unknown, rules: {define: (name: string, rule: unknown) => void}, utils: typeof import('../../utils/eslintUtils')}, transformCode: string, code: string) {
    utils.defineRule(rules, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
