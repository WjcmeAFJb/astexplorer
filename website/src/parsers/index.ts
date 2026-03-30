type Transformer = import('../types').Transformer;
type Parser = import('../types').Parser;
type Category = import('../types').Category;

const localRequire = require.context('./', true, /^\.\/(?!utils|transpilers)[^/]+\/(transformers\/([^/]+)\/)?(codeExample\.txt|[^/]+?\.tsx?)$/);

function interopRequire<T extends Record<string, unknown>>(module: {__esModule?: boolean, default?: T, [key: string]: unknown}): T {
  return (module.__esModule ? module.default : module as T);
}

const files =
  localRequire.keys()
  .map(name => name.split('/').slice(1));

const categoryByID: Record<string, Category> = {};
const parserByID: Record<string, Parser> = {};
const transformerByID: Record<string, Transformer> = {};

const restrictedParserNames = new Set([
  'index.ts',
  'codeExample.txt',
  'transformers',
  'utils',
]);

export const categories: Category[] =
  files
  .filter(name => name[1] === 'index.ts')
  .map(([catName]) => {
        let category: Category = localRequire(`./${catName}/index.ts`);

    categoryByID[category.id] = category;

    category.codeExample = ((interopRequire(localRequire(`./${catName}/codeExample.txt`)) as unknown) as string)

    let catFiles =
      files
      .filter(([curCatName]) => curCatName === catName)
      .map(name => name.slice(1));

    category.parsers =
      catFiles
      .filter(([parserName]) => !restrictedParserNames.has(parserName))
      .map(([parserName]) => {
                let parser: Parser = interopRequire(localRequire(`./${catName}/${parserName}`));
        parserByID[parser.id] = parser;
        parser.category = category;
        return parser;
      });

    category.transformers =
      catFiles
      .filter(([dirName, , fileName]) => dirName === 'transformers' && fileName === 'index.ts')
      .map(([, transformerName]) => {
        const transformerDir = `./${catName}/transformers/${transformerName}`;
                const transformer: Transformer = interopRequire(localRequire(`${transformerDir}/index.ts`));
        transformerByID[transformer.id] = transformer;
        transformer.defaultTransform = ((interopRequire(localRequire(`${transformerDir}/codeExample.txt`)) as unknown) as string);
        return transformer;
      });

    return category;
  });

export function getDefaultCategory(): Category {
  return categoryByID.javascript;
}

export function getDefaultParser(category?: Category): Parser {
  return category.parsers.filter(p => p.showInMenu)[0];
}

export function getCategoryByID(id: string): Category {
  return categoryByID[id];
}

export function getParserByID(id: string): Parser {
  return parserByID[id];
}

export function getTransformerByID(id: string): Transformer {
  return transformerByID[id];
}
