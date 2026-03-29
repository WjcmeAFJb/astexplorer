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

  loadParser(/** @type {*} */ callback) {
    require(['posthtml-parser'], callback);
  },

  parse(/** @type {*} */ posthtmlParser, /** @type {*} */ code, /** @type {*} */ options) {
    return posthtmlParser(code, options);
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'content';
  },

  getDefaultOptions() {
    return { lowerCaseTags: false, lowerCaseAttributeNames: false };
  },

  typeProps: new Set(['tag']),
};
