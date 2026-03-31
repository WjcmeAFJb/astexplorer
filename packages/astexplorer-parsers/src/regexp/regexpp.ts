import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'regexpp/package.json';

const ID = 'regexpp';

export const defaultOptions: import("regexpp").RegExpParser.Options = {
  strict: false,
  ecmaVersion: 2020,
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['end', 'start']),

  loadParser(callback: (realParser: typeof import('regexpp')) => void) {
    require(['regexpp'], callback);
  },

  parse(regexpp: typeof import('regexpp'), code: string, options: import('regexpp').RegExpParser.Options) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    return regexpp.parseRegExpLiteral(code, options);
  },

  nodeToRange(node: import('regexpp').AST.Node) {
    if (typeof node.start === 'number' && typeof node.end === 'number') {
      return [node.start, node.end];
    }
  },

  opensByDefault(node: import('regexpp').AST.Node, key: string) {
    return (
      key === 'pattern' ||
      key === 'elements' ||
      key === 'element' ||
      key === 'alternatives'
    );
  },

  getDefaultOptions() {
    return defaultOptions;
  },

  _ignoredProperties: new Set(['parent', 'references', 'resolved']),

};
