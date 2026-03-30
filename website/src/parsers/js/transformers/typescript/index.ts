import compileModule from '../../../utils/compileModule';
import pkg from 'typescript/package.json';

const ID = 'typescript';
const FILENAME = 'astExplorer.tsx';

export default {
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  showInMenu: true,

  defaultParserID: 'typescript',

  loadTransformer(callback: (realTransformer: {transpile: (code: string) => string, ts: typeof import('typescript')}) => void) {
    require(['../../../transpilers/typescript', 'typescript'], (
      transpile: {default: (code: string) => string},
      typescript: typeof import('typescript'),
    ) => callback({ transpile: transpile.default, ts: typescript }));
  },

  transform({ transpile, ts }: {transpile: (code: string) => string, ts: typeof import('typescript')}, transformCode: string, code: string) {
    // basic scaffolding to get a compiled javascript module from the user provided code
    transformCode = transpile(transformCode);
    const mod = compileModule(
      // eslint-disable-line no-shadow
      transformCode,
      { ts },
    );

    // check that the exported value is valid
    const createTransformer = mod.default || mod;
    if (typeof createTransformer !== 'function') {
      throw new TypeError('expected the default export to be a program transformer factory');
    }

    // Create a minimal typescript host object needed for the rest of the compiler api
    const host /*: ts.host*/ = {
      fileExists: () => true,
      getCanonicalFileName: (filename: string) => filename,
      getCurrentDirectory: () => '',
      getDefaultLibFileName: () => 'lib.d.ts',
      getNewLine: () => '\n',
      getSourceFile: (filename: string) => {
        return ts.createSourceFile(
          filename,
          code,
          ts.ScriptTarget.Latest,
          true,
        );
      },
      readFile: (): undefined => undefined,
      useCaseSensitiveFileNames: () => true,
      writeFile: (): undefined => undefined,
    };

    // create the program with the provided file as entry point
    const program = ts.createProgram([FILENAME], {
      noResolve: true,
      target: ts.ScriptTarget.Latest,
      experimentalDecorators: true,
      experimentalAsyncFunctions: true,
      jsx: 2 as import('typescript').JsxEmit, // ts.JsxEmit.React
    }, host);

    // create the user provided transformer by invoking the factory
    const transformerFactory = (createTransformer(program) as import('typescript').TransformerFactory<import('typescript').SourceFile>);

    // create a source file node from the file contents
    const sourceFile = program.getSourceFile(FILENAME)

    // transform the source file node with the created transformer
    const transformResult = ts.transform(sourceFile, [transformerFactory], program.getCompilerOptions());

    // retrieve the result source file node
    const resultFile = transformResult.transformed[0];

    // create a printer and print the file to a string
    const printer = ts.createPrinter();
    const result = printer.printFile(resultFile);

    return result;
  },
};
