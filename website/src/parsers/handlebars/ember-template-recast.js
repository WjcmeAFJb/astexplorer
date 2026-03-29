import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'ember-template-recast/package.json';

const ID = 'ember-template-recast';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['ember-template-recast'], (/** @type {{parse: (code: string) => Record<string, unknown>}} */ recast) => callback(recast.parse));
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
