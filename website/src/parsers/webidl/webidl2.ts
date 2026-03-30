import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'webidl2/package.json';
import type { IDLRootType as WebIDL2Node } from 'webidl2';

type WebIDL2Module = typeof import('webidl2');

const ID = 'webidl2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/w3c/webidl2.js',
  typeProps: new Set(['name', 'type', 'idlType', 'escapedName']),

  getNodeName(node: { name?: string, type?: string, idlType?: { idlType?: string } | string, optional?: boolean }) {
    if (node.name) {
        return node.name + (node.optional ? '?' : '');
    } else if (node.type) {
        return node.type;
    } else if (node.idlType) {
        return typeof node.idlType === 'object' ? node.idlType.idlType : node.idlType;
    }
  },

  loadParser(callback: (realParser: WebIDL2Module) => void) {
    require(['webidl2'], callback);
  },

  parse({ parse }: WebIDL2Module, code: string, options: import('webidl2').ParseOptions) {
    return parse(code, options);
  },

  opensByDefault(node: {members?: object[]}, key: string) {
    return key === 'members';
  },

  getDefaultOptions() {
    return {
      concrete: false,
    };
  },
};
