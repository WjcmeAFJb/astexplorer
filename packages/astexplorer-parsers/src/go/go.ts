import defaultParserInterface from '../utils/defaultParserInterface'

type GoParser = {parseFile: (code: string) => Record<string, unknown>};

const ID = 'go'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: '1.13.4',
  homepage: 'https://golang.org/pkg/go/',
  _ignoredProperties: new Set(['_type']),
  locationProps: new Set(['Loc']),

  async loadParser(callback: (realParser: GoParser) => void) {
    require(['astexplorer-go/go', 'astexplorer-go/parser.wasm'], async (_goRuntime: unknown, wasmModule: {default: string}) => {
      const go = (window as unknown as {_go: {run: (inst: WebAssembly.Instance) => void, importObject: WebAssembly.Imports}})._go;
      const result = await WebAssembly.instantiateStreaming(fetch(wasmModule.default), go.importObject);
      go.run(result.instance);
      callback({
        parseFile: (code: string) => JSON.parse((window as unknown as {__GO_PARSE_FILE__: (code: string) => string}).__GO_PARSE_FILE__(code)),
      });
    })
  },

  parse(parser: GoParser, code: string) {
    return parser.parseFile(code)
  },

  getNodeName(node: Record<string, unknown>) {
    return node._type
  },

  nodeToRange(node: {Loc?: {Start: {Offset: number}, End: {Offset: number}}, [key: string]: unknown}) {
    if (node.Loc) {
      return [node.Loc.Start, node.Loc.End].map(({ Offset }: {Offset: number}) => Offset)
    }
  },
}
