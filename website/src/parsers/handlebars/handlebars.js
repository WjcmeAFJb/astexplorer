import defaultParserInterface from './utils/defaultHandlebarsParserInterface';
import pkg from 'handlebars/package.json';

const ID = 'handlebars';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,

  loadParser(/** @type {(realParser: typeof import('handlebars').parse) => void} */ callback) {
    require(['handlebars'], (/** @type {typeof import('handlebars')} */ handlebars) => callback(handlebars.parse));
  },

  opensByDefault(/** @type {ReturnType<typeof import('handlebars').parse>} */ node, /** @type {string} */ key) {
    return key === 'body';
  },
};
