import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'pug-parser/package.json';

type PugParser = { lex(code: string, options: object): object, parse(tokens: object, options: object): object };
type PugNode = { type?: string, name?: string, val?: string, buffer?: boolean, mode?: string, expr?: string, call?: boolean, optional?: boolean, block?: PugNode, nodes?: PugNode[], [key: string]: unknown };

const ID = 'pug';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/pugjs/pug',
  typeProps: new Set(['type', 'name']),
  locationProps: new Set(['line', 'column']),

  loadParser(callback: (realParser: unknown) => void) {
    require(['pug-lexer', 'pug-parser'], (lex: (code: string, options: object) => object, parse: (tokens: object, options: object) => object) => {
      callback({ lex, parse });
    });
  },

  parse({ lex, parse }: {lex: (code: string, options: object) => object, parse: (tokens: object, options: object) => object}, code: string) {
    return parse(lex(code, {}), { src: code });
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    switch (key) {
      case 'block':
      case 'nodes':
        return true;
    }
  },

  getNodeName(node: Record<string, unknown>) {
    let { type } = node;
    /* eslint-disable no-fallthrough */
    switch (type) {
      case 'Block': return '';
      case 'Doctype': return `Doctype(${node.val})`;
      case 'Comment': if (node.buffer) return 'Comment(buffer)';
      case 'NamedBlock': return `Block:${node.mode}(${node.name})`;
      case 'Code': if (node.val === 'break') return 'Code(break)';
      case 'When': if (node.expr === 'default') return 'When(default)';
      case 'Include':
      case 'RawInclude':
      case 'Extends':
      case 'Each':
      case 'While':
      case 'Conditional':
      case 'Case':
      case 'AttributeBlock':
      case 'Text': return type;
      default: type = 'Attribute';
      case 'Filter':
      case 'Mixin': if (node.call) type = 'Mixin:call';
      case 'Tag': return `${type}(${node.name})`;
    }
    /* eslint-enable no-fallthrough */
  },
};
