/**
 * Shared JSDoc type definitions for astexplorer.
 *
 * This file is not imported at runtime — it exists solely so that
 * `@import('./types')` (or `@typedef {import('./types').X}`) can
 * pull in the types below for editor / tsc --checkJs support.
 */

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

export type Category = {
  id: string;
  displayName: string;
  mimeTypes: string[];
  fileExtension: string;
  editorMode?: string;
  codeExample: string;
  parsers: Parser[];
  transformers: Transformer[];
};

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

export type SettingsConfiguration = {
  title?: string;
  fields: Array<string | [string, Array<string|number>|Record<string,string|number>, ((v: string) => string|number)?] | SettingsConfiguration>;
  required?: Set<string>;
  update?: (settings: Record<string, unknown>, name: string, value: unknown) => Record<string, unknown>;
  key?: string;
  settings?: (settings: Record<string, unknown>) => Record<string, unknown>;
  values?: (settings: Record<string, unknown>) => Record<string, unknown>;
};

export type Parser = {
  id: string;
  displayName: string;
  version?: string;
  homepage?: string;
  showInMenu: boolean;
  _ignoredProperties: Set<string>;
  locationProps: Set<string>;
  typeProps: Set<string>;
  category: Category;
  loadParser: (callback: (realParser: unknown) => void) => void;
  parse: (realParser: unknown, code: string, options: Record<string, unknown>) => unknown;
  opensByDefault: (node: unknown, key: string) => boolean;
  nodeToRange: (node: unknown) => [number, number] | null | undefined;
  getNodeName: (node: unknown) => string | undefined;
  forEachProperty: (node: unknown) => Iterable<WalkResult>;
  _getSettingsConfiguration: (defaultOptions: Record<string, unknown>) => SettingsConfiguration | null;
  hasSettings: () => boolean;
  getDefaultOptions: () => Record<string, unknown>;
  _mergeDefaultOptions: (currentOptions: Record<string, unknown>, defaultOptions: Record<string, unknown>) => Record<string, unknown>;
  renderSettings: ((settings: Record<string, unknown> | null, onChange: (settings: Record<string, unknown>) => void) => React.ReactElement | null) | undefined;
  _promise?: Promise<unknown>;
};

// ---------------------------------------------------------------------------
// Transformer
// ---------------------------------------------------------------------------

export type Transformer = {
  id: string;
  displayName: string;
  version?: string;
  homepage?: string;
  defaultParserID: string;
  compatibleParserIDs?: Set<string>;
  defaultTransform: string;
  showInMenu?: boolean;
  loadTransformer: (callback: (realTransformer: unknown) => void) => void;
  transform: (realTransformer: unknown, transformCode: string, code: string) => Promise<string | TransformResultWithMap>;
  formatCodeExample?: (code: string, options: Record<string, unknown>) => string;
  _promise?: Promise<unknown>;
};

export type TransformResultWithMap = {
  code: string;
  map?: unknown;
};

// ---------------------------------------------------------------------------
// Revision  (common interface for gist.Revision and parse.Revision)
// ---------------------------------------------------------------------------

export type Revision = {
  canSave: () => boolean;
  getPath: () => string;
  getSnippetID: () => string;
  getRevisionID: () => string | number;
  getTransformerID: () => string | undefined;
  getTransformCode: () => string;
  getParserID: () => string;
  getCode: () => string;
  getParserSettings: () => Record<string, unknown> | null;
  getShareInfo: () => React.ReactElement;
};

// ---------------------------------------------------------------------------
// ParseResult
// ---------------------------------------------------------------------------

export type TreeAdapterConfig = {
  type: string;
  options: AdapterOptions;
};

export type ParseResult = {
  ast: unknown;
  error: Error | null;
  time: number | null;
  treeAdapter: TreeAdapterConfig | null;
};

// ---------------------------------------------------------------------------
// TreeAdapter
// ---------------------------------------------------------------------------

export type WalkResult = {
  value: unknown;
  key: string;
  computed: boolean;
};

export type TreeFilter = {
  key?: string;
  label?: string;
  test: (value: unknown, key: string, fromArray?: boolean) => boolean;
};

export type AdapterOptions = {
  filters?: TreeFilter[];
  openByDefault: (node: unknown, key: string) => boolean;
  nodeToRange: (node: unknown) => [number, number] | null;
  nodeToName: (node: unknown) => string;
  walkNode: (node: unknown) => Iterable<WalkResult>;
  locationProps?: Set<string>;
};

// ---------------------------------------------------------------------------
// Redux state
// ---------------------------------------------------------------------------

export type TransformState = {
  code: string;
  initialCode: string;
  transformer: string | null;
  transformResult: TransformResult | null;
};

export type TransformResult = {
  result?: string;
  error?: Error;
  map?: import('source-map/lib/source-map-consumer').SourceMapConsumer | null;
  version?: string;
};

export type WorkbenchState = {
  parser: string;
  parserSettings: Record<string, unknown> | null;
  parseResult?: ParseResult;
  parseError?: unknown;
  code: string;
  keyMap: string;
  initialCode: string;
  transform: TransformState;
};

export type AppState = {
  showSettingsDialog: boolean;
  showSettingsDrawer: boolean;
  showShareDialog: boolean;
  loadingSnippet: boolean;
  forking: boolean;
  saving: boolean;
  cursor: number | null;
  error: Error | null;
  showTransformPanel: boolean;
  selectedRevision?: Revision | null;
  activeRevision?: Revision | null;
  parserSettings: Record<string, Record<string, unknown>>;
  parserPerCategory: Record<string, string>;
  workbench: WorkbenchState;
  enableFormatting: boolean;
};

// ---------------------------------------------------------------------------
// Redux actions
// ---------------------------------------------------------------------------

export type ActionType = 'SET_ERROR' | 'CLEAR_ERROR' | 'LOAD_SNIPPET' | 'START_LOADING_SNIPPET' |
  'DONE_LOADING_SNIPPET' | 'CLEAR_SNIPPET' | 'CHANGE_CATEGORY' | 'SELECT_TRANSFORMER' |
  'HIDE_TRANSFORMER' | 'SET_TRANSFORM' | 'SET_TRANSFORM_RESULT' | 'SET_PARSER' |
  'SET_PARSER_SETTINGS' | 'SET_PARSE_RESULT' | 'SET_SNIPPET' | 'OPEN_SETTINGS_DIALOG' |
  'CLOSE_SETTINGS_DIALOG' | 'EXPAND_SETTINGS_DRAWER' | 'COLLAPSE_SETTINGS_DRAWER' |
  'OPEN_SHARE_DIALOG' | 'CLOSE_SHARE_DIALOG' | 'SET_CODE' | 'SET_CURSOR' |
  'DROP_TEXT' | 'SAVE' | 'START_SAVE' | 'END_SAVE' | 'RESET' | 'TOGGLE_FORMATTING' |
  'SET_KEY_MAP' | 'INIT';

export type Action = {
  type: ActionType;
  error?: Error | null;
  parser?: Parser;
  settings?: Record<string, unknown>;
  fork?: boolean;
  revision?: Revision;
  category?: Category;
  transformer?: Transformer;
  code?: string;
  cursor?: number;
  text?: string;
  categoryId?: string;
  keyMap?: string;
  result?: ParseResult;
};

// ---------------------------------------------------------------------------
// Storage backend
// ---------------------------------------------------------------------------

export type StorageBackend = {
  owns: (snippet: Revision) => boolean;
  matchesURL: () => boolean;
  fetchFromURL: () => Promise<Revision | null>;
  create: (data: SnippetData) => Promise<Revision>;
  update: (revision: Revision, data: SnippetData) => Promise<Revision>;
  fork: (revision: Revision, data: SnippetData) => Promise<Revision>;
  updateHash?: ((revision: Revision) => void);
};

export type SnippetData = {
  parserID: string;
  settings: Record<string, Record<string, unknown> | null>;
  versions: Record<string, string>;
  filename: string;
  code: string;
  toolID?: string;
  transform?: string | null;
};
