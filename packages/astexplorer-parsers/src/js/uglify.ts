import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'uglify-es/package.json';
import compileModule from '../utils/compileModule';

const ID = 'uglify-js';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['TYPE']),

  loadParser(callback: (realParser: unknown) => void) {
    require([
      'raw-loader?esModule=false!uglify-es/lib/utils.js',
      'raw-loader?esModule=false!uglify-es/lib/ast.js',
      'raw-loader?esModule=false!uglify-es/lib/parse.js',
    ], (...contents) => {
      contents.push('exports.parse = parse;');
      callback(compileModule(contents.join('\n\n')));
    });
  },

  parse(UglifyJS: {parse: (code: string, options?: object) => object}, code: string) {
    return UglifyJS.parse(code);
  },

  getNodeName(node: Record<string, unknown>) {
    let type = node.TYPE;
    if (type === 'Token') {
      type += `(${node.type})`;
    }
    return type;
  },

  nodeToRange(node: {TYPE?: string, start?: {pos: number, endpos: number}, end?: {pos: number, endpos: number}, pos?: number, endpos?: number, [key: string]: unknown}) {
    let start, end;
    switch (node.TYPE) {
      case 'Token':
        start = end = node;
        break;
      case undefined:
        return null;
      default:
        ({ start, end } = node);
        break;
    }
    if (start && end) {
      return [start.pos, end.endpos];
    }
    return null;
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    return (
      key === 'body' ||
      key === 'elements' || // array literals
      key === 'definitions' || // variable declaration
      key === 'properties'
    );
  },

  _ignoredProperties: new Set(['_walk', 'CTOR']),
};
