type Transformer = import('./types').Transformer;
type Parser = import('./types').Parser;
type Category = import('./types').Category;

import {registry} from './registry';

function interopRequire<T extends Record<string, unknown>>(module: {__esModule?: boolean, default?: T, [key: string]: unknown} | T): T {
  if (module && typeof module === 'object' && '__esModule' in module && module.__esModule) {
    return module.default as T;
  }
  return module as T;
}

const categoryByID: Record<string, Category> = {};
const parserByID: Record<string, Parser> = {};
const transformerByID: Record<string, Transformer> = {};

export const categories: Category[] =
  registry.map(({category: catModule, codeExample, parsers: parserModules, transformers: transformerModules}) => {
    let category = catModule as Category;

    categoryByID[category.id] = category;

    category.codeExample = ((interopRequire(codeExample as any) as unknown) as string);

    category.parsers =
      parserModules.map(mod => {
        let parser: Parser = interopRequire(mod as any);
        parserByID[parser.id] = parser;
        parser.category = category;
        return parser;
      });

    category.transformers =
      transformerModules.map(({module: mod, codeExample: txCode}) => {
        const transformer: Transformer = interopRequire(mod as any);
        transformerByID[transformer.id] = transformer;
        transformer.defaultTransform = ((interopRequire(txCode as any) as unknown) as string);
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

export type {Category, Parser, Transformer} from './types';
export type {SettingsConfiguration, TransformResultWithMap, WalkResult} from './types';
