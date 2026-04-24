/**
 * Shared JSDoc type definitions for astexplorer.
 *
 * This file is not imported at runtime — it exists solely so that
 * `@import('./types')` (or `@typedef {import('./types').X}`) can
 * pull in the types below for editor / tsc --checkJs support.
 */

/** Minimal SourceMapConsumer shape (source-map package has broken typings field). */
export type SourceMapConsumer = {
  sourcesContent: string[];
  sources: string[];
  generatedPositionFor(originalPosition: { line: number; column: number; source: string }): {
    line: number | null;
    column: number | null;
    lastColumn: number | null;
  };
};

// ---------------------------------------------------------------------------
// Parser-related types (re-exported from astexplorer-parsers)
// ---------------------------------------------------------------------------

import type {
  Category,
  Parser,
  SettingsConfiguration,
  Transformer,
  TransformResultWithMap,
  WalkResult,
} from 'astexplorer-parsers/types';

export type {
  Category,
  Parser,
  SettingsConfiguration,
  Transformer,
  TransformResultWithMap,
  WalkResult,
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
  getParserSettings: () => Record<string, unknown> | null | false;
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
  cursor?: number | null;
  /** tree-gex hover-mode: show sub-expression boundary under mouse and match its capture */
  hoverMode?: boolean;
};

export type TransformResult = {
  result?: string;
  error?: Error | null;
  map?: SourceMapConsumer | null;
  version?: string;
  /** tree-gex cursor capture: nodes with positions in the original source. */
  cursorNodes?: unknown[];
  /** tree-gex cursor capture: nodes with positions in the transform output
   *  (empty when the output isn't parseable source). */
  cursorOutputNodes?: unknown[];
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
  parsing: boolean;
  transforming: boolean;
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

export type Action = {
  type: string;
  error?: Error | null;
  parser?: Parser;
  settings?: Record<string, unknown>;
  fork?: boolean;
  revision?: Revision;
  category?: Category;
  transformer?: Transformer;
  code?: string;
  cursor?: number | null;
  text?: string;
  categoryId?: string;
  keyMap?: string;
  result?: ParseResult | TransformResult;
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
  updateHash?: (revision: Revision) => void;
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
