import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'handlebars/package.json';

const ID = 'handlebars';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['handlebars'], (handlebars) => callback(handlebars.parse));
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
