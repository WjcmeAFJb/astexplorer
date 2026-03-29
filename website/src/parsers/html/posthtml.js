import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'posthtml-parser/package.json';

const ID = 'posthtml-parser';
const name = 'posthtml-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: name,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/fb55/htmlparser2',

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['posthtml-parser'], callback);
  },

  parse(/** @type {DynModule} */ posthtmlParser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return posthtmlParser(code, options);
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'content';
  },

  getDefaultOptions() {
    return { lowerCaseTags: false, lowerCaseAttributeNames: false };
  },

  typeProps: new Set(['tag']),
};
