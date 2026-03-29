import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'ember-template-recast/package.json';

const ID = 'ember-template-recast';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {*} */ callback) {
    require(['ember-template-recast'], (recast) => callback(recast.parse));
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'body';
  },
};
