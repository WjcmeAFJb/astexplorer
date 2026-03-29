/**
 * Shared JSDoc type definitions for astexplorer.
 *
 * This file is not imported at runtime — it exists solely so that
 * `@import('./types.js')` (or `@typedef {import('./types.js').X}`) can
 * pull in the types below for editor / tsc --checkJs support.
 */

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} displayName
 * @property {string[]} mimeTypes
 * @property {string} fileExtension
 * @property {string} [editorMode]
 * @property {string} codeExample
 * @property {Parser[]} parsers
 * @property {Transformer[]} transformers
 */

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} SettingsField
 * A single field entry in a settings configuration.
 * Can be a boolean field name (string), a tuple, or a nested SettingsConfiguration.
 * @see SettingsConfiguration
 */

/**
 * @typedef {Object} SettingsConfiguration
 * @property {string} [title]
 * @property {Array<string | [string, Array<string|number>|Record<string,string|number>, ((v: string) => string|number)?] | SettingsConfiguration>} fields
 * @property {Set<string>} [required]
 * @property {(settings: Record<string, unknown>, name: string, value: unknown) => Record<string, unknown>} [update]
 * @property {string} [key]
 * @property {(settings: Record<string, unknown>) => Record<string, unknown>} [settings]
 * @property {(settings: Record<string, unknown>) => Record<string, unknown>} [values]
 */

/**
 * @typedef {Object} Parser
 * @property {string} id
 * @property {string} displayName
 * @property {string} [version]
 * @property {string} [homepage]
 * @property {boolean} showInMenu
 * @property {Set<string>} _ignoredProperties
 * @property {Set<string>} locationProps
 * @property {Set<string>} typeProps
 * @property {Category} category
 * @property {(callback: (realParser: DynModule) => void) => void} loadParser
 * @property {(realParser: DynModule, code: string, options: Record<string, unknown>) => ASTNode} parse
 * @property {(node: ASTNode, key: string) => boolean} opensByDefault
 * @property {(node: ASTNode) => [number, number] | null | undefined} nodeToRange
 * @property {(node: ASTNode) => string | undefined} getNodeName
 * @property {(node: ASTNode) => Iterable<WalkResult>} forEachProperty
 * @property {(defaultOptions: Record<string, unknown>) => SettingsConfiguration | null} _getSettingsConfiguration
 * @property {() => boolean} hasSettings
 * @property {() => Record<string, unknown>} getDefaultOptions
 * @property {(currentOptions: Record<string, unknown>, defaultOptions: Record<string, unknown>) => Record<string, unknown>} _mergeDefaultOptions
 * @property {((settings: Record<string, unknown> | null, onChange: (settings: Record<string, unknown>) => void) => React.ReactElement | null) | undefined} renderSettings
 * @property {Promise<DynModule>} [_promise]
 */

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Transformer
 * @property {string} id
 * @property {string} displayName
 * @property {string} [version]
 * @property {string} [homepage]
 * @property {string} defaultParserID
 * @property {Set<string>} [compatibleParserIDs]
 * @property {string} defaultTransform
 * @property {boolean} [showInMenu]
 * @property {((code: string, context: {parser: string, parserSettings: Record<string,unknown>}) => string) | undefined} [formatCodeExample]
 * @property {(callback: (realTransformer: DynModule) => void) => void} loadTransformer
 * @property {(realTransformer: DynModule, transformCode: string, code: string) => Promise<string | TransformResultWithMap>} transform
 * @property {Promise<DynModule>} [_promise]
 */

/**
 * @typedef {Object} TransformResultWithMap
 * @property {string} code
 * @property {unknown} [map]
 */

// ---------------------------------------------------------------------------
// Revision  (common interface for gist.Revision and parse.Revision)
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} Revision
 * @property {() => boolean} canSave
 * @property {() => string} getPath
 * @property {() => string} getSnippetID
 * @property {() => string | number} getRevisionID
 * @property {() => string | undefined} getTransformerID
 * @property {() => string} getTransformCode
 * @property {() => string} getParserID
 * @property {() => string} getCode
 * @property {() => Record<string, unknown> | null} getParserSettings
 * @property {() => React.ReactElement} getShareInfo
 */

// ---------------------------------------------------------------------------
// ParseResult
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TreeAdapterConfig
 * @property {string} type
 * @property {AdapterOptions} options
 */

/**
 * @typedef {Object} ParseResult
 * @property {ASTNode | null} ast
 * @property {Error | null} error
 * @property {number | null} time
 * @property {TreeAdapterConfig | null} treeAdapter
 */

// ---------------------------------------------------------------------------
// TreeAdapter
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} WalkResult
 * @property {ASTNodeValue} value
 * @property {string} key
 * @property {boolean} computed
 */

/**
 * @typedef {Object} TreeFilter
 * @property {string} [key]
 * @property {string} [label]
 * @property {(value: ASTNodeValue, key: string, fromArray?: boolean) => boolean} test
 */

/**
 * @typedef {Object} AdapterOptions
 * @property {TreeFilter[]} [filters]
 * @property {(node: ASTNode, key: string) => boolean} openByDefault
 * @property {(node: ASTNode) => [number, number] | null} nodeToRange
 * @property {(node: ASTNode) => string} nodeToName
 * @property {(node: ASTNode) => Iterable<WalkResult>} walkNode
 * @property {Set<string>} [locationProps]
 */

// ---------------------------------------------------------------------------
// Redux state
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} TransformState
 * @property {string} code
 * @property {string} initialCode
 * @property {string | null} transformer
 * @property {TransformResult | null} transformResult
 */

/**
 * @typedef {Object} TransformResult
 * @property {string} [result]
 * @property {Error} [error]
 * @property {import('source-map/lib/source-map-consumer').SourceMapConsumer | null} [map]
 * @property {string} [version]
 */

/**
 * @typedef {Object} WorkbenchState
 * @property {string} parser
 * @property {Record<string, unknown> | null} parserSettings
 * @property {ParseResult} [parseResult]
 * @property {unknown} [parseError]
 * @property {string} code
 * @property {string} keyMap
 * @property {string} initialCode
 * @property {TransformState} transform
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} showSettingsDialog
 * @property {boolean} showSettingsDrawer
 * @property {boolean} showShareDialog
 * @property {boolean} loadingSnippet
 * @property {boolean} forking
 * @property {boolean} saving
 * @property {number | null} cursor
 * @property {Error | null} error
 * @property {boolean} showTransformPanel
 * @property {Revision | null} [selectedRevision]
 * @property {Revision | null} [activeRevision]
 * @property {Record<string, Record<string, unknown>>} parserSettings
 * @property {Record<string, string>} parserPerCategory
 * @property {WorkbenchState} workbench
 * @property {boolean} enableFormatting
 */

// ---------------------------------------------------------------------------
// Redux actions
// ---------------------------------------------------------------------------

/**
 * @typedef {'SET_ERROR' | 'CLEAR_ERROR' | 'LOAD_SNIPPET' | 'START_LOADING_SNIPPET' |
 *   'DONE_LOADING_SNIPPET' | 'CLEAR_SNIPPET' | 'CHANGE_CATEGORY' | 'SELECT_TRANSFORMER' |
 *   'HIDE_TRANSFORMER' | 'SET_TRANSFORM' | 'SET_TRANSFORM_RESULT' | 'SET_PARSER' |
 *   'SET_PARSER_SETTINGS' | 'SET_PARSE_RESULT' | 'SET_SNIPPET' | 'OPEN_SETTINGS_DIALOG' |
 *   'CLOSE_SETTINGS_DIALOG' | 'EXPAND_SETTINGS_DRAWER' | 'COLLAPSE_SETTINGS_DRAWER' |
 *   'OPEN_SHARE_DIALOG' | 'CLOSE_SHARE_DIALOG' | 'SET_CODE' | 'SET_CURSOR' |
 *   'DROP_TEXT' | 'SAVE' | 'START_SAVE' | 'END_SAVE' | 'RESET' | 'TOGGLE_FORMATTING' |
 *   'SET_KEY_MAP' | 'INIT'} ActionType
 */

/**
 * @typedef {Object} Action
 * @property {ActionType} type
 * @property {Error | null} [error]
 * @property {Parser} [parser]
 * @property {Record<string, unknown>} [settings]
 * @property {boolean} [fork]
 * @property {Revision} [revision]
 * @property {Category} [category]
 * @property {Transformer} [transformer]
 * @property {string} [code]
 * @property {number} [cursor]
 * @property {string} [text]
 * @property {string} [categoryId]
 * @property {string} [keyMap]
 * @property {ParseResult} [result]
 */

// ---------------------------------------------------------------------------
// Storage backend
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} StorageBackend
 * @property {(snippet: Revision) => boolean} owns
 * @property {() => boolean} matchesURL
 * @property {() => Promise<Revision | null>} fetchFromURL
 * @property {(data: SnippetData) => Promise<Revision>} create
 * @property {(revision: Revision, data: SnippetData) => Promise<Revision>} update
 * @property {(revision: Revision, data: SnippetData) => Promise<Revision>} fork
 * @property {((revision: Revision) => void)} [updateHash]
 */

/**
 * @typedef {Object} SnippetData
 * @property {string} parserID
 * @property {Record<string, Record<string, unknown> | null>} settings
 * @property {Record<string, string>} versions
 * @property {string} filename
 * @property {string} code
 * @property {string} [toolID]
 * @property {string | null} [transform]
 */

export {};
