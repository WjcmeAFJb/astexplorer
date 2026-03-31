import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'regjsparser/package.json';

const ID = 'regjsparser';

export const defaultOptions = {
  unicodePropertyEscape: true,
  namedGroups: true,
  lookbehind: true,
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['range']),

  loadParser(callback: (realParser: {parse: (pattern: string, flags: string, options: object) => object}) => void) {
    require(['regjsparser'], callback);
  },

  parse(regjsparser: {parse: (pattern: string, flags: string, options: object) => object}, code: string, options: Record<string, unknown>) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    var firstSlash = code.indexOf('/');
    var lastSlash = code.lastIndexOf('/');
    if (firstSlash !== 0 || lastSlash < 1) {
      throw new Error('Please wrap the regex pattern by slash `/`, i.e. /foo/');
    }
    var flags = code.slice(lastSlash + 1);
    var pattern = code.slice(firstSlash + 1, lastSlash);
    return regjsparser.parse(pattern, flags, options);
  },

  nodeToRange(node: {range?: [number, number], [key: string]: unknown}) {
    if (node.range != null) {
      return [node.range[0] + 1, node.range[1] + 1];
    }
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return (
        key === 'body'
    );
  },

  getDefaultOptions() {
    return defaultOptions;
  },

};
