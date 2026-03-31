import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'sqlite-parser/package.json';

const ID = 'sqlite-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/codeschool/sqlite-parser',

  loadParser(callback: (realParser: (code: string) => Record<string, unknown>) => void) {
    require(['sqlite-parser'], callback);
  },

  parse(sqliteParser: (code: string) => Record<string, unknown>, code: string) {
    return sqliteParser(code);
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return key === 'statement';
  },

};
