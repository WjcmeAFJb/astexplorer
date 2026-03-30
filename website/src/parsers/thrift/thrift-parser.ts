import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@creditkarma/thrift-parser/package.json';

type ThriftParserModule = typeof import('@creditkarma/thrift-parser');

const ID = 'ck-thrift-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/creditkarma/thrift-parser',
  locationProps: new Set(['location']),

  loadParser(callback: (realParser: ThriftParserModule) => void) {
    require(['@creditkarma/thrift-parser'], callback);
  },

  parse({parse}: ThriftParserModule, code: string) {
    return parse(code);
  },

  getNodeName(node: {type?: string}) {
    return node.type;
  },

  nodeToRange({ loc }: {loc?: {start: {index: number}, end: {index: number}} | null}) {
    if (loc !== null && loc !== undefined) {
      return [loc.start.index, loc.end.index];
    }
  },

  opensByDefault(node: {type?: string} | string, key: string) {
    return node === 'ThriftDocument' || key === 'body';
  },
};
