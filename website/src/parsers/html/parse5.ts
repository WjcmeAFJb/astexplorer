import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'parse5/package.json';

type Parse5Module = { Parser: new (opts: object) => { parse(code: string): Parse5Node }, TreeAdapters: Record<string, object> };
type Parse5Node = { type?: string, name?: string, nodeName?: string, tagName?: string, sourceCodeLocation?: { startOffset: number, endOffset: number }, children?: Parse5Node[], childNodes?: Parse5Node[], [k: string]: unknown };

const ID = 'parse5';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['sourceCodeLocation']),
  typeProps: new Set(['type', 'name', 'nodeName', 'tagName']),

  loadParser(callback: (realParser: Parse5Module) => void) {
    require([
      'parse5/lib/parser',
      'parse5/lib/tree-adapters/default',
      'parse5-htmlparser2-tree-adapter',
    ], (Parser: new (opts: object) => {parse: (code: string) => Parse5Node}, defaultAdapter: object, htmlparser2Adapter: object) => {
      callback({
        Parser,
        TreeAdapters: {
          default: defaultAdapter,
          htmlparser2: htmlparser2Adapter,
        },
      });
    });
  },

  parse(this: {options: {treeAdapter?: string; [k: string]: unknown}}, { Parser, TreeAdapters }: Parse5Module, code: string, options: {treeAdapter?: string, [k: string]: unknown}) {
    this.options = options;
    return new Parser({
      treeAdapter: TreeAdapters[this.options.treeAdapter],
      sourceCodeLocationInfo: true,
    }).parse(code);
  },

  getNodeName(this: {options: {treeAdapter?: string; [k: string]: unknown}}, node: Parse5Node) {
    if (this.options.treeAdapter === 'htmlparser2') {
      if (node.type) {
        return node.type + (node.name && node.type !== 'root' ? `(${node.name})` : '');
      }
    } else {
      return node.nodeName;
    }
  },

  nodeToRange({ sourceCodeLocation: loc }: Parse5Node) {
    if (loc) {
      return [loc.startOffset, loc.endOffset];
    }
  },

  opensByDefault(node: Parse5Node, key: string) {
    return key === 'children' || key === 'childNodes';
  },

  getDefaultOptions() {
    return {
      treeAdapter: 'default',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields : [
        ['treeAdapter', ['default', 'htmlparser2']],
      ],
    };
  },

  _ignoredProperties: new Set(['parentNode', 'prev', 'next', 'parent', 'firstChild', 'lastChild']),
};
