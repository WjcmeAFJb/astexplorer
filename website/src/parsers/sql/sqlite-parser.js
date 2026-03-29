import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'sqlite-parser/package.json';

const ID = 'sqlite-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/codeschool/sqlite-parser',

  loadParser(/** @type {*} */ callback) {
    require(['sqlite-parser'], callback);
  },

  parse(/** @type {*} */ sqliteParser, /** @type {*} */ code) {
    return sqliteParser(code);
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'statement';
  },

};
