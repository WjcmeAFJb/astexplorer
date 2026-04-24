/**
 * Type definitions for astexplorer parsers.
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
  transform: (realTransformer: unknown, transformCode: string, code: string, cursor?: number) => Promise<string | TransformResultWithMap>;
  formatCodeExample?: (code: string, options: Record<string, unknown>) => string;
  _promise?: Promise<unknown>;
};

export type TransformResultWithMap = {
  code: string;
  map?: unknown;
  /** tree-gex cursor-capture: matched AST nodes for highlighting in the UI. */
  cursorNodes?: unknown[];
};

// ---------------------------------------------------------------------------
// WalkResult (used by forEachProperty)
// ---------------------------------------------------------------------------

export type WalkResult = {
  value: unknown;
  key: string;
  computed: boolean;
};
