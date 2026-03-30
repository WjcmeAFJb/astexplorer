/** @typedef {import('../types').Category} Category */
/** @typedef {import('../types').Parser} Parser */
/** @typedef {import('../types').Transformer} Transformer */

const localRequire = require.context('./', true, /^\.\/(?!utils|transpilers)[^/]+\/(transformers\/([^/]+)\/)?(codeExample\.txt|[^/]+?\.js)$/);

/**
 * @template {Record<string, unknown>} T
 * @param {T & {__esModule?: boolean, default?: T}} module
 * @returns {T}
 */
function interopRequire(module) {
  return /** @type {T} */ (module.__esModule ? module.default : module);
}

const files =
  localRequire.keys()
  .map(name => name.split('/').slice(1));

/** @type {Record<string, Category>} */
const categoryByID = {};
/** @type {Record<string, Parser>} */
const parserByID = {};
/** @type {Record<string, Transformer>} */
const transformerByID = {};

const restrictedParserNames = new Set([
  'index.js',
  'codeExample.txt',
  'transformers',
  'utils',
]);

/** @type {Category[]} */
export const categories =
  files
  .filter(name => name[1] === 'index.js')
  .map(([catName]) => {
    /** @type {Category} */
    let category = localRequire(`./${catName}/index.js`);

    categoryByID[category.id] = category;

    category.codeExample = /** @type {string} */ (/** @type {unknown} */ (interopRequire(localRequire(`./${catName}/codeExample.txt`))))

    let catFiles =
      files
      .filter(([curCatName]) => curCatName === catName)
      .map(name => name.slice(1));

    category.parsers =
      catFiles
      .filter(([parserName]) => !restrictedParserNames.has(parserName))
      .map(([parserName]) => {
        /** @type {Parser} */
        let parser = interopRequire(localRequire(`./${catName}/${parserName}`));
        parserByID[parser.id] = parser;
        parser.category = category;
        return parser;
      });

    category.transformers =
      catFiles
      .filter(([dirName, , fileName]) => dirName === 'transformers' && fileName === 'index.js')
      .map(([, transformerName]) => {
        const transformerDir = `./${catName}/transformers/${transformerName}`;
        /** @type {Transformer} */
        const transformer = interopRequire(localRequire(`${transformerDir}/index.js`));
        transformerByID[transformer.id] = transformer;
        transformer.defaultTransform = /** @type {string} */ (/** @type {unknown} */ (interopRequire(localRequire(`${transformerDir}/codeExample.txt`))));
        return transformer;
      });

    return category;
  });

/** @returns {Category} */
export function getDefaultCategory() {
  return categoryByID.javascript;
}

/**
 * @param {Category} [category]
 * @returns {Parser}
 */
export function getDefaultParser(category = getDefaultCategory()) {
  return category.parsers.filter(p => p.showInMenu)[0];
}

/**
 * @param {string} id
 * @returns {Category}
 */
export function getCategoryByID(id) {
  return categoryByID[id];
}

/**
 * @param {string} id
 * @returns {Parser}
 */
export function getParserByID(id) {
  return parserByID[id];
}

/**
 * @param {string} id
 * @returns {Transformer}
 */
export function getTransformerByID(id) {
  return transformerByID[id];
}
