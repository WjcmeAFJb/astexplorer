import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  loadParser(/** @type {*} */ callback) {
    require(['@glimmer/syntax'], (glimmer) => callback(glimmer.preprocess));
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'body';
  },
};
