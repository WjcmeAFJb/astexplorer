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

  async loadParser(/** @type {*} */ callback) {
    require(['astexplorer-go'], async parser => {
      await parser.init()
      callback(parser)
    })
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code) {
    return parser.parseFile(code)
  },

  getNodeName(/** @type {*} */ node) {
    return node._type
  },

  nodeToRange(/** @type {*} */ node) {
    if (node.Loc) {
      return [node.Loc.Start, node.Loc.End].map(({ Offset }) => Offset)
    }
  },
}
