import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['@glimmer/syntax'], (/** @type {any} */ glimmer) => callback(glimmer.preprocess));
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
