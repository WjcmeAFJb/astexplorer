import defaultParserInterface from '../utils/defaultParserInterface'

const ID = 'go'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: '1.13.4',
  homepage: 'https://golang.org/pkg/go/',
  _ignoredProperties: new Set(['_type']),
  locationProps: new Set(['Loc']),

  async loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['astexplorer-go'], async (/** @type {any} */ parser) => {
      await parser.init()
      callback(parser)
    })
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
    return parser.parseFile(code)
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node._type
  },

  nodeToRange(/** @type {any} */ node) {
    if (node.Loc) {
      return [/** @type {any} */ (node.Loc).Start, /** @type {any} */ (node.Loc).End].map((/** @type {any} */ { Offset }) => Offset)
    }
  },
}
