import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'sqlite-parser/package.json';

const ID = 'sqlite-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/codeschool/sqlite-parser',

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['sqlite-parser'], callback);
  },

  parse(/** @type {DynModule} */ sqliteParser, /** @type {string} */ code) {
    return sqliteParser(code);
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'statement';
  },

};
