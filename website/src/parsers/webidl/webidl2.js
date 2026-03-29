import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'webidl2/package.json';

/**
 * @typedef {{ parse(code: string, options?: any): object }} WebIDL2Parser
 * @typedef {{ name?: string, type?: string, idlType?: { idlType?: string } | string, escapedName?: string, optional?: boolean, members?: object[], [key: string]: unknown }} WebIDL2Node
 */

const ID = 'webidl2';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/w3c/webidl2.js',
  typeProps: new Set(['name', 'type', 'idlType', 'escapedName']),

  getNodeName(/** @type {any} */ node) {
    if (node.name) {
        return node.name + (node.optional ? '?' : '');
    } else if (node.type) {
        return node.type;
    } else if (node.idlType) {
        return node.idlType.idlType || node.idlType;
    }
  },

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['webidl2'], callback);
  },

  parse(/** @type {Record<string, any>} */ { parse }, /** @type {string} */ code, /** @type {any} */ options) {
    return parse(code, options);
  },

  opensByDefault(/** @type {any} */ node, /** @type {string} */ key) {
    return key === 'members';
  },

  getDefaultOptions() {
    return {
      concrete: false,
    };
  },
};
