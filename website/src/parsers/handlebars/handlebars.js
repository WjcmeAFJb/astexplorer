import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'handlebars/package.json';

const ID = 'handlebars';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['handlebars'], (/** @type {any} */ handlebars) => callback(handlebars.parse));
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
