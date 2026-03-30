import pkg from 'eslint8/package.json';

const ID = 'eslint-v8';
const name = 'ESLint v8';

export default {
  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'babel-eslint',

  loadTransformer(/** @type {(realTransformer: {eslint: {defineRule: (name: string, rule: unknown) => void, defineParser: (name: string, parser: object) => void, verifyAndFix: (code: string, config: object) => {messages: Array<{message: string, line: number, column: number, source?: string}>, output: string}}, sourceCode: new (code: string, ast: unknown) => unknown, utils: typeof import('../../utils/eslint4Utils')}) => void} */ callback) {
    require([
      'eslint8/lib/linter',
      'eslint8/lib/source-code',
      '../../utils/eslint4Utils',
    ], (/** @type {{Linter: new () => {defineRule: (name: string, rule: unknown) => void, defineParser: (name: string, parser: object) => void, verifyAndFix: (code: string, config: object) => {messages: Array<{message: string, line: number, column: number, source?: string}>, output: string}}}} */ Linter, sourceCode: new (code: string, ast: unknown) => unknown, utils: typeof import('../../utils/eslint4Utils')) =>
      callback({ eslint: new Linter.Linter(), sourceCode, utils }));
  },

  transform(/** @type {{eslint: {defineRule: (name: string, rule: unknown) => void, defineParser: (name: string, parser: object) => void, verifyAndFix: (code: string, config: object) => {messages: Array<{message: string, line: number, column: number, source?: string}>, output: string}}, sourceCode: new (code: string, ast: unknown) => unknown, utils: {defineRule: typeof import('../../utils/eslint4Utils').defineRule, runRule: (code: string, eslint: object, sourceCode: unknown) => string, formatResults: typeof import('../../utils/eslint4Utils').formatResults, formatResult: typeof import('../../utils/eslint4Utils').formatResult}}} */ { eslint, sourceCode, utils }, transformCode: string, code: string) {
    utils.defineRule(eslint, transformCode);
    return utils.runRule(code, eslint, sourceCode);
  },
};
