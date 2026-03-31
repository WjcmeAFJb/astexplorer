import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  loadParser(callback: (realParser: typeof import('@glimmer/syntax').preprocess) => void) {
    require(['@glimmer/syntax'], (glimmer: typeof import('@glimmer/syntax')) => callback(glimmer.preprocess));
  },

  opensByDefault(node: import('@glimmer/syntax').ASTv1.Node, key: string) {
    return key === 'body';
  },
};
