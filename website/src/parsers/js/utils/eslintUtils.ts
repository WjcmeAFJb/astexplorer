import compileModule from '../../utils/compileModule';
import transpile from '../../transpilers/babel';
import {parseNoPatch} from 'babel-eslint';

/** @typedef {{message: string, line: number, column: number, source?: string}} EslintResult */

export function formatResults(results: EslintResult[]) {
  return results.length === 0
    ? 'Lint rule not fired.'
    : results.map(formatResult).join('').trim();
}

export function formatResult(result: EslintResult) {
  var pointer = '-'.repeat(result.column - 1) + '^';
  return `
// ${result.message} (at ${result.line}:${result.column})
   ${result.source}
// ${pointer}
`;
}

export function defineRule(/** @type {{define: (name: string, rule: unknown) => void}} */ eslintRules, code: string) {
  // Compile the transform code and install it as an ESLint rule. The rule
  // name doesn't really matter here, so we'll just use a hard-coded name.
  code = transpile(code);
  const rule = compileModule(code);
  eslintRules.define('astExplorerRule', rule.default || rule);
}

export function runRule(code: string, /** @type {{verify: (source: unknown, config: object) => EslintResult[]}} */ eslint, sourceCode: new (code: string, ast: unknown) => unknown) {
  // Run the ESLint rule on the AST of the provided code.
  // Reference: http://eslint.org/docs/developer-guide/nodejs-api
  const ast = parseNoPatch(code, {
    sourceType: 'module',
  });
  const results = eslint.verify(new sourceCode(code, ast), {
    env: {es6: true},
    parserOptions: {
      ecmaVersion: 8,
      sourceType: 'module',
      ecmaFeatures: {experimentalObjectRestSpread: true},
    },
    rules: {
      astExplorerRule: 2,
    },
  });
  return formatResults(results);
}
