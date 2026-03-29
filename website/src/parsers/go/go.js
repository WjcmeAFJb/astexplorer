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

  async loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['astexplorer-go'], async parser => {
      await parser.init()
      callback(parser)
    })
  },

  parse(/** @type {Record<string, Function>} */ parser, /** @type {string} */ code) {
    return parser.parseFile(code)
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node._type
  },

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
    if (node.Loc) {
      return [node.Loc.Start, node.Loc.End].map(({ Offset }) => Offset)
    }
  },
}
