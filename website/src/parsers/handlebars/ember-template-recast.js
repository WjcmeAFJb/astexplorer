import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'ember-template-recast/package.json';

const ID = 'ember-template-recast';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: typeof import('ember-template-recast').parse) => void} */ callback) {
    require(['ember-template-recast'], (/** @type {typeof import('ember-template-recast')} */ recast) => callback(recast.parse));
  },

  opensByDefault(/** @type {import('@glimmer/syntax').ASTv1.Node} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
