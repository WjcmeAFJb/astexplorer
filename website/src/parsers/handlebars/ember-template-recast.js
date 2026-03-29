import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'ember-template-recast/package.json';

const ID = 'ember-template-recast';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['ember-template-recast'], (recast) => callback(recast.parse));
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
