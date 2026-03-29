import compileModule from '../../../utils/compileModule';
import pkg from 'tslint/package.json';

const ID = 'tslint';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  defaultParserID: 'typescript',

  loadTransformer(/** @type {*} */ callback) {
    require([
      '../../../transpilers/typescript',
      'tslint/lib/index',
      'typescript',
    ],
    (
      transpile,
      tslint,
      typescript,
    ) => callback({transpile: transpile.default, tslint, typescript}));
  },

  transform(/** @type {*} */ { transpile, tslint, typescript }, /** @type {*} */ transformCode, /** @type {*} */ code) {
    transformCode = transpile(transformCode);
    let transform = compileModule( // eslint-disable-line no-shadow
      transformCode,
      {
        Lint: tslint,
        ts: typescript,
      },
    );

    let linter = new tslint.Linter({});
    let rule = new transform.Rule({});
    let sourceFile = linter.getSourceFile('astExplorer.ts', code);
    let ruleFailures = linter.applyRule(rule, sourceFile);
    
    return formatResults(ruleFailures);
  },
};

function formatResults(/** @type {*} */ results) {
  return results.length === 0
    ? 'Lint rule not fired.'
    : results.map(formatResult).join('').trim();
}

function formatResult(/** @type {*} */ result) {
  let { line, character } = result.startPosition.lineAndCharacter;
  let rawLine = result.rawLines.split('\n')[line];
  let pointer = '-'.repeat(character) + '^';
  return `
// ${result.failure} (at ${line+1}:${character+1})
   ${rawLine}
// ${pointer}
`;
}
