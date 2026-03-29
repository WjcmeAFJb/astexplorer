import compileModule from '../../utils/compileModule';
import transpile from '../../transpilers/babel';
import { parseNoPatch } from 'babel-eslint';

export function formatResults(/** @type {Record<string, unknown>} */ results, /** @type {string} */ code) {
  return results.length === 0
    ? '// Lint rule not fired.'
    : results
        .map((/** @type {Record<string, unknown>} */ result) => formatResult(result, code))
        .join('')
        .trim();
}

export function formatResult(/** @type {Record<string, unknown>} */ result, /** @type {string} */ code) {
  var pointer = '-'.repeat(result.column - 1) + '^';
  return `
// ${result.message} (at ${result.line}:${result.column})
   ${getSourceFromResult(result, code)}
// ${pointer}
`;
}
function getSourceFromResult(/** @type {Record<string, unknown>} */ result, /** @type {string} */ code) {
  if (result.source) {
    return result.source;
  }
  let linesOfCode = code.split('\n');
  return linesOfCode[result.line - 1];
}
export function defineRule(/** @type {Record<string, unknown>} */ eslint, /** @type {string} */ code) {
  // Compile the transform code and install it as an ESLint rule. The rule
  // name doesn't really matter here, so we'll just use a hard-coded name.
  code = transpile(code);
  const rule = compileModule(code);
  eslint.defineRule('astExplorerRule', rule.default || rule);
}

export function runRule(/** @type {string} */ code, /** @type {Record<string, unknown>} */ eslint) {
  // Run the ESLint rule on the AST of the provided code.
  // Reference: http://eslint.org/docs/developer-guide/nodejs-api
  eslint.defineParser('babel-eslint', {
    parse(/** @type {string} */ code) {
      return parseNoPatch(code, { sourceType: 'module' });
    },
  });
  const results = eslint.verifyAndFix(code, {
    env: { es6: true },
    parser: 'babel-eslint',
    parserOptions: {
      ecmaVersion: 8,
      sourceType: 'module',
      ecmaFeatures: { experimentalObjectRestSpread: true },
    },
    rules: {
      astExplorerRule: 2,
    },
  });
  let output = formatResults(results.messages, code);
  output += `

// Fixed output follows:
// ${'-'.repeat(80)}
`;
  return output + results.output;
}
