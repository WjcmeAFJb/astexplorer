import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from '@glimmer/syntax/package.json';

const ID = 'glimmer';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  // @ts-expect-error — pkg.homepage may not exist in this package.json
  homepage: pkg.homepage || 'https://github.com/glimmerjs/glimmer-vm',

  loadParser(callback) {
    require(['@glimmer/syntax'], (glimmer) => callback(glimmer.preprocess));
  },

  opensByDefault(node, key) {
    return key === 'body';
  },
};
