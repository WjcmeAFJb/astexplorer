import compileModule from '../../../utils/compileModule';
import pkg from 'tslint/package.json';

const ID = 'tslint';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'typescript',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, tslint: typeof import('tslint'), typescript: typeof import('typescript')}) => void) {
    require([
      '../../../transpilers/typescript',
      'tslint/lib/index',
      'typescript',
    ],
    (
      transpile: {default: (code: string) => string},
      tslint: typeof import('tslint'),
      typescript: typeof import('typescript'),
    ) => callback({transpile: transpile.default, tslint, typescript}));
  },

  transform({ transpile, tslint, typescript }: {transpile: (code: string) => string, tslint: typeof import('tslint'), typescript: typeof import('typescript')}, transformCode: string, code: string) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        Lint: tslint,
        ts: typescript,
      },
    );

    let linter = new tslint.Linter(({fix: false} as import('tslint').ILinterOptions));
    let Rule = (transform.Rule as new (opts: Record<string, unknown>) => unknown);
    let rule = new Rule({});
    // getSourceFile and applyRule are private in the typings but accessible at runtime
    const linterInternal = ((linter as unknown) as {getSourceFile: (name: string, code: string) => unknown, applyRule: (rule: unknown, file: unknown) => TslintFailure[]});
    let sourceFile = linterInternal.getSourceFile('astExplorer.ts', code);
    let ruleFailures = linterInternal.applyRule(rule, sourceFile);

    return formatResults(ruleFailures);
  },
};

type TslintFailure = {startPosition: {lineAndCharacter: {line: number, character: number}}, rawLines: string, failure: string};

function formatResults(results: TslintFailure[]) {
  return results.length === 0
    ? 'Lint rule not fired.'
    : results.map(formatResult).join('').trim();
}

function formatResult(result: TslintFailure) {
  let { line, character } = result.startPosition.lineAndCharacter;
  let rawLine = result.rawLines.split('\n')[line];
  let pointer = '-'.repeat(character) + '^';
  return `
// ${result.failure} (at ${line+1}:${character+1})
   ${rawLine}
// ${pointer}
`;
}
