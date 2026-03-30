import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'webidl2/package.json';

/**
 * @typedef {typeof import('webidl2')} WebIDL2Module
 * @typedef {import('webidl2').IDLRootType} WebIDL2Node
 */

const ID = 'webidl2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/w3c/webidl2.js',
  typeProps: new Set(['name', 'type', 'idlType', 'escapedName']),

  getNodeName(/** @type {{ name?: string, type?: string, idlType?: { idlType?: string } | string, optional?: boolean }} */ node) {
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

  parse(/** @type {WebIDL2Module} */ { parse }, code: string, options: import('webidl2').ParseOptions) {
    return parse(code, options);
  },

  opensByDefault(/** @type {{members?: object[]}} */ node, key: string) {
    return key === 'members';
  },

  getDefaultOptions() {
    return {
      concrete: false,
    };
  },
};
