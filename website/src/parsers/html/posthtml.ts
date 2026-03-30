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

  loadParser(callback: (realParser: typeof import('posthtml-parser')) => void) {
    require(['posthtml-parser'], callback);
  },

  parse(posthtmlParser: typeof import('posthtml-parser'), code: string, options: import('posthtml-parser').Options) {
    return posthtmlParser(code, options);
  },

  opensByDefault(node: import('posthtml-parser').NodeTag, key: string) {
    return key === 'content';
  },

  getDefaultOptions() {
    return { lowerCaseTags: false, lowerCaseAttributeNames: false };
  },

  typeProps: new Set(['tag']),
};
