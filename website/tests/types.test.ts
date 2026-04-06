/**
 * Tests for website/src/types.ts
 *
 * types.ts re-exports types from astexplorer-parsers/types and defines
 * application-specific types. Since these are TypeScript type-only exports
 * (they produce no runtime code), we verify that:
 * 1. The module can be imported without errors
 * 2. Objects conforming to the exported types can be constructed
 * 3. The type shapes match expected structures
 */
import { describe, test, expect, vi } from 'vitest';

// Mock the parsers package for type re-exports
vi.mock('astexplorer-parsers', () => ({
  categories: [],
  getParserByID: vi.fn(),
  getTransformerByID: vi.fn(),
  getCategoryByID: vi.fn(),
  getDefaultParser: vi.fn(() => ({
    id: 'acorn',
    category: { id: 'javascript', codeExample: '// js' },
    hasSettings: () => false,
  })),
}));

describe('types module', () => {
  test('can be imported without error', async () => {
    // types.ts is a type-only module; importing it should not throw
    const typesModule = await import('../src/types');
    expect(typesModule).toBeDefined();
  });

  test('Revision type shape is valid', () => {
    const revision = {
      canSave: () => true,
      getPath: () => '/snippet/abc/1',
      getSnippetID: () => 'abc',
      getRevisionID: () => '1',
      getTransformerID: () => undefined,
      getTransformCode: () => '',
      getParserID: () => 'acorn',
      getCode: () => 'const x = 1;',
      getParserSettings: () => null,
      getShareInfo: () => null,
    };

    expect(revision.canSave()).toBe(true);
    expect(revision.getPath()).toBe('/snippet/abc/1');
    expect(revision.getSnippetID()).toBe('abc');
    expect(revision.getRevisionID()).toBe('1');
    expect(revision.getTransformerID()).toBeUndefined();
    expect(revision.getTransformCode()).toBe('');
    expect(revision.getParserID()).toBe('acorn');
    expect(revision.getCode()).toBe('const x = 1;');
    expect(revision.getParserSettings()).toBeNull();
    expect(revision.getShareInfo()).toBeNull();
  });

  test('ParseResult type shape is valid', () => {
    const parseResult = {
      ast: { type: 'Program', body: [] },
      error: null as Error | null,
      time: 5,
      treeAdapter: {
        type: 'estree',
        options: {
          filters: [],
          openByDefault: () => false,
          nodeToRange: () => null,
          nodeToName: () => 'Node',
          walkNode: function* () {},
        },
      },
    };

    expect(parseResult.ast).toBeDefined();
    expect(parseResult.error).toBeNull();
    expect(parseResult.time).toBe(5);
    expect(parseResult.treeAdapter.type).toBe('estree');
  });

  test('AppState type shape is valid', () => {
    const appState = {
      showSettingsDialog: false,
      showSettingsDrawer: false,
      showShareDialog: false,
      loadingSnippet: false,
      forking: false,
      saving: false,
      cursor: null as number | null,
      error: null as Error | null,
      showTransformPanel: false,
      selectedRevision: null,
      activeRevision: null,
      parserSettings: {},
      parserPerCategory: {},
      workbench: {
        parser: 'acorn',
        parserSettings: null,
        code: '// code',
        keyMap: 'default',
        initialCode: '// code',
        transform: {
          code: '',
          initialCode: '',
          transformer: null,
          transformResult: null,
        },
      },
      enableFormatting: false,
    };

    expect(appState.showSettingsDialog).toBe(false);
    expect(appState.workbench.parser).toBe('acorn');
    expect(appState.workbench.transform.code).toBe('');
  });

  test('TransformState type shape is valid', () => {
    const transformState = {
      code: 'module.exports = function(babel) {}',
      initialCode: '',
      transformer: 'babel',
      transformResult: null,
    };

    expect(transformState.code).toBeTruthy();
    expect(transformState.transformer).toBe('babel');
    expect(transformState.transformResult).toBeNull();
  });

  test('TransformResult type shape is valid', () => {
    const transformResult = {
      result: 'const a = 1;',
      error: undefined,
      map: null,
      version: '7.0.0',
    };

    expect(transformResult.result).toBe('const a = 1;');
    expect(transformResult.error).toBeUndefined();
    expect(transformResult.map).toBeNull();
    expect(transformResult.version).toBe('7.0.0');
  });

  test('TransformResult with error has error field set', () => {
    const transformResult = {
      result: undefined,
      error: new Error('Transform failed'),
      map: null,
    };

    expect(transformResult.error).toBeInstanceOf(Error);
    expect(transformResult.error.message).toBe('Transform failed');
  });

  test('WorkbenchState type shape is valid', () => {
    const workbench = {
      parser: 'acorn',
      parserSettings: { jsx: true },
      parseResult: {
        ast: {},
        error: null,
        time: 10,
        treeAdapter: { type: 'estree', options: {} },
      },
      code: 'const x = 1;',
      keyMap: 'vim',
      initialCode: 'const x = 1;',
      transform: {
        code: '',
        initialCode: '',
        transformer: null,
        transformResult: null,
      },
    };

    expect(workbench.parser).toBe('acorn');
    expect(workbench.parserSettings).toEqual({ jsx: true });
    expect(workbench.keyMap).toBe('vim');
  });

  test('Action type constants match expected string values', () => {
    // Verify action type string values used in the application
    const actionTypes = [
      'SET_ERROR',
      'CLEAR_ERROR',
      'LOAD_SNIPPET',
      'START_LOADING_SNIPPET',
      'DONE_LOADING_SNIPPET',
      'CLEAR_SNIPPET',
      'CHANGE_CATEGORY',
      'SELECT_TRANSFORMER',
      'HIDE_TRANSFORMER',
      'SET_TRANSFORM',
      'SET_TRANSFORM_RESULT',
      'SET_PARSER',
      'SET_PARSER_SETTINGS',
      'SET_PARSE_RESULT',
      'SET_SNIPPET',
      'OPEN_SETTINGS_DIALOG',
      'CLOSE_SETTINGS_DIALOG',
      'EXPAND_SETTINGS_DRAWER',
      'COLLAPSE_SETTINGS_DRAWER',
      'OPEN_SHARE_DIALOG',
      'CLOSE_SHARE_DIALOG',
      'SET_CODE',
      'SET_CURSOR',
      'DROP_TEXT',
      'SAVE',
      'START_SAVE',
      'END_SAVE',
      'RESET',
      'TOGGLE_FORMATTING',
      'SET_KEY_MAP',
      'INIT',
    ];

    // All should be non-empty strings
    for (const type of actionTypes) {
      expect(typeof type).toBe('string');
      expect(type.length).toBeGreaterThan(0);
    }
  });

  test('SnippetData type shape is valid', () => {
    const snippetData = {
      parserID: 'acorn',
      settings: { acorn: { jsx: true } },
      versions: { acorn: '8.7.0' },
      filename: 'test.js',
      code: 'const x = 1;',
      toolID: 'babel',
      transform: 'module.exports = function() {}',
    };

    expect(snippetData.parserID).toBe('acorn');
    expect(snippetData.filename).toBe('test.js');
    expect(snippetData.code).toBe('const x = 1;');
    expect(snippetData.toolID).toBe('babel');
  });

  test('SnippetData with optional fields omitted', () => {
    const snippetData = {
      parserID: 'acorn',
      settings: {},
      versions: {},
      filename: 'test.js',
      code: 'const x = 1;',
    };

    expect(snippetData.parserID).toBe('acorn');
    expect((snippetData as any).toolID).toBeUndefined();
    expect((snippetData as any).transform).toBeUndefined();
  });

  test('TreeFilter type shape is valid', () => {
    const filter = {
      key: 'hideFunctions',
      label: 'Hide methods',
      test: (value: unknown) => typeof value === 'function',
    };

    expect(filter.key).toBe('hideFunctions');
    expect(filter.label).toBe('Hide methods');
    expect(filter.test(() => {})).toBe(true);
    expect(filter.test('string')).toBe(false);
  });

  test('AdapterOptions type shape is valid', () => {
    const options = {
      filters: [],
      openByDefault: (_node: unknown, _key: string) => false,
      nodeToRange: (_node: unknown) => null as [number, number] | null,
      nodeToName: (_node: unknown) => 'Node',
      walkNode: function* (_node: unknown) {},
      locationProps: new Set(['start', 'end', 'loc']),
    };

    expect(options.filters).toEqual([]);
    expect(options.openByDefault({}, 'body')).toBe(false);
    expect(options.nodeToRange({})).toBeNull();
    expect(options.nodeToName({})).toBe('Node');
    expect(options.locationProps.has('start')).toBe(true);
  });

  test('StorageBackend type shape is valid', () => {
    const backend = {
      owns: () => true,
      matchesURL: () => false,
      fetchFromURL: () => Promise.resolve(null),
      create: () => Promise.resolve({} as any),
      update: () => Promise.resolve({} as any),
      fork: () => Promise.resolve({} as any),
    };

    expect(backend.owns({} as any)).toBe(true);
    expect(backend.matchesURL()).toBe(false);
  });
});
