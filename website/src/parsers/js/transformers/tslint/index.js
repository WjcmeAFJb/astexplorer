import compileModule from '../../../utils/compileModule';
import pkg from 'tslint/package.json';

const ID = 'tslint';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'typescript',

  loadTransformer(/** @type {(realTransformer: {transpile: (code: string) => string, tslint: {Linter: new (opts: object) => {getSourceFile: (name: string, code: string) => unknown, applyRule: (rule: unknown, file: unknown) => TslintFailure[]}}, typescript: typeof import('typescript')}) => void} */ callback) {
    require([
      '../../../transpilers/typescript',
      'tslint/lib/index',
      'typescript',
    ],
    (
      /** @type {{default: (code: string) => string}} */ transpile,
      /** @type {{Linter: new (opts: object) => {getSourceFile: (name: string, code: string) => unknown, applyRule: (rule: unknown, file: unknown) => TslintFailure[]}}} */ tslint,
      /** @type {typeof import('typescript')} */ typescript,
    ) => callback({transpile: transpile.default, tslint, typescript}));
  },

  transform(/** @type {{transpile: (code: string) => string, tslint: {Linter: new (opts: object) => {getSourceFile: (name: string, code: string) => unknown, applyRule: (rule: unknown, file: unknown) => TslintFailure[]}}, typescript: typeof import('typescript')}} */ { transpile, tslint, typescript }, /** @type {string} */ transformCode, /** @type {string} */ code) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        Lint: tslint,
        ts: typescript,
      },
    );

    let linter = new tslint.Linter({});
    let Rule = /** @type {new (opts: Record<string, unknown>) => unknown} */ (transform.Rule);
    let rule = new Rule({});
    let sourceFile = linter.getSourceFile('astExplorer.ts', code);
    let ruleFailures = linter.applyRule(rule, sourceFile);
    
    return formatResults(ruleFailures);
  },
};

/** @typedef {{startPosition: {lineAndCharacter: {line: number, character: number}}, rawLines: string, failure: string}} TslintFailure */

function formatResults(/** @type {TslintFailure[]} */ results) {
  return results.length === 0
    ? 'Lint rule not fired.'
    : results.map(formatResult).join('').trim();
}

function formatResult(/** @type {TslintFailure} */ result) {
  let { line, character } = result.startPosition.lineAndCharacter;
  let rawLine = result.rawLines.split('\n')[line];
  let pointer = '-'.repeat(character) + '^';
  return `
// ${result.failure} (at ${line+1}:${character+1})
   ${rawLine}
// ${pointer}
`;
}
