import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  loadParser(/** @type {(realParser: typeof import('@glimmer/syntax').preprocess) => void} */ callback) {
    require(['@glimmer/syntax'], (/** @type {typeof import('@glimmer/syntax')} */ glimmer) => callback(glimmer.preprocess));
  },

  opensByDefault(/** @type {import('@glimmer/syntax').ASTv1.Node} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
