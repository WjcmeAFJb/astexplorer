import defaultParserInterface from '../utils/defaultParserInterface'

/**
 * @typedef {{init: () => Promise<void>, parseFile: (code: string) => Record<string, unknown>}} GoParser
 */

const ID = 'go'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: '1.13.4',
  homepage: 'https://golang.org/pkg/go/',
  _ignoredProperties: new Set(['_type']),
  locationProps: new Set(['Loc']),

  async loadParser(/** @type {(realParser: GoParser) => void} */ callback) {
    require(['astexplorer-go'], async (/** @type {GoParser} */ parser) => {
      await parser.init()
      callback(parser)
    })
  },

  parse(/** @type {GoParser} */ parser, /** @type {string} */ code) {
    return parser.parseFile(code)
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node._type
  },

  nodeToRange(/** @type {{Loc?: {Start: {Offset: number}, End: {Offset: number}}, [key: string]: unknown}} */ node) {
    if (node.Loc) {
      return [node.Loc.Start, node.Loc.End].map((/** @type {{Offset: number}} */ { Offset }) => Offset)
    }
  },
}
