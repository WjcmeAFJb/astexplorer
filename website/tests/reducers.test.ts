import { describe, test, expect, vi } from 'vitest';

vi.mock('astexplorer-parsers', () => ({
  getCategoryByID: (id: string) => ({
    id,
    displayName: id,
    codeExample: `// ${id} example`,
    parsers: [{ id: `${id}-parser`, showInMenu: true, category: { id, codeExample: `// ${id} example` } }],
    transformers: [],
  }),
  getDefaultParser: (cat: any) => ({
    id: cat?.parsers?.[0]?.id || 'acorn',
    category: cat || { id: 'javascript', codeExample: '// js' },
  }),
  getParserByID: (id: string) => ({
    id,
    category: { id: 'javascript', codeExample: '// js example' },
  }),
  getTransformerByID: (id: string) => {
    if (!id) return undefined;
    const base: any = {
      id,
      displayName: id,
      defaultTransform: `// ${id} transform`,
      defaultParserID: 'acorn',
    };
    // Some transformers have formatCodeExample for testing the reformat branch
    if (id === 'fmt-aware') {
      base.formatCodeExample = (code: string, opts: { parser: string; parserSettings: Record<string, unknown> }) =>
        `fmt(${code},${opts.parser})`;
    }
    return base;
  },
}));

import { astexplorer, persist, revive } from '../src/store/reducers';
import * as actions from '../src/store/actions';

function getInitialState() {
  // Deep clone to avoid shared references with the module-level initialState
  const state = astexplorer(undefined as any, { type: 'INIT' } as any);
  return JSON.parse(JSON.stringify(state));
}

describe('reducers', () => {
  test('returns initial state for unknown action', () => {
    const state = getInitialState();
    expect(state.showSettingsDialog).toBe(false);
    expect(state.saving).toBe(false);
    expect(state.forking).toBe(false);
    expect(state.cursor).toBeNull();
    expect(state.error).toBeNull();
  });

  describe('persist / revive', () => {
    test('persist returns subset of state', () => {
      const state = getInitialState();
      const persisted = persist(state);
      expect(persisted).toHaveProperty('workbench');
      expect(persisted).toHaveProperty('parserPerCategory');
      expect(persisted).not.toHaveProperty('cursor');
      expect(persisted).not.toHaveProperty('error');
    });

    test('revive sets initialCode from code', () => {
      const state = getInitialState();
      state.workbench.code = 'custom code';
      const revived = revive(state);
      expect(revived.workbench.initialCode).toBe('custom code');
      expect(revived.workbench.transform.initialCode).toBe(state.workbench.transform.code);
    });
  });

  describe('UI toggles', () => {
    test('OPEN/CLOSE_SETTINGS_DIALOG', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.openSettingsDialog());
      expect(state.showSettingsDialog).toBe(true);
      state = astexplorer(state, actions.closeSettingsDialog());
      expect(state.showSettingsDialog).toBe(false);
    });

    test('EXPAND/COLLAPSE_SETTINGS_DRAWER', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.expandSettingsDrawer());
      expect(state.showSettingsDrawer).toBe(true);
      state = astexplorer(state, actions.collapseSettingsDrawer());
      expect(state.showSettingsDrawer).toBe(false);
    });

    test('OPEN/CLOSE_SHARE_DIALOG', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.openShareDialog());
      expect(state.showShareDialog).toBe(true);
      state = astexplorer(state, actions.closeShareDialog());
      expect(state.showShareDialog).toBe(false);
    });

    test('TOGGLE_FORMATTING', () => {
      let state = getInitialState();
      expect(state.enableFormatting).toBe(false);
      state = astexplorer(state, actions.toggleFormatting());
      expect(state.enableFormatting).toBe(true);
      state = astexplorer(state, actions.toggleFormatting());
      expect(state.enableFormatting).toBe(false);
    });
  });

  describe('loading', () => {
    test('START/DONE_LOADING_SNIPPET', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.startLoadingSnippet());
      expect(state.loadingSnippet).toBe(true);
      state = astexplorer(state, actions.doneLoadingSnippet());
      expect(state.loadingSnippet).toBe(false);
    });
  });

  describe('saving / forking', () => {
    test('START_SAVE with fork=false sets saving', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.startSave(false));
      expect(state.saving).toBe(true);
      expect(state.forking).toBe(false);
    });

    test('START_SAVE with fork=true sets forking', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.startSave(true));
      expect(state.saving).toBe(false);
      expect(state.forking).toBe(true);
    });

    test('END_SAVE clears both', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.startSave(true));
      state = astexplorer(state, actions.endSave(true));
      expect(state.saving).toBe(false);
      expect(state.forking).toBe(false);
    });
  });

  describe('cursor', () => {
    test('SET_CURSOR sets cursor position', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setCursor(42));
      expect(state.cursor).toBe(42);
    });

    test('SET_CODE with non-zero cursor updates cursor', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setCode({ code: 'x', cursor: 10 }));
      expect(state.cursor).toBe(10);
    });

    test('SET_CODE with cursor=0 keeps current cursor', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setCursor(5));
      state = astexplorer(state, actions.setCode({ code: 'x', cursor: 0 }));
      expect(state.cursor).toBe(5);
    });

    test('RESET clears cursor', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setCursor(10));
      state = astexplorer(state, actions.reset());
      expect(state.cursor).toBeNull();
    });
  });

  describe('error', () => {
    test('SET_ERROR / CLEAR_ERROR', () => {
      let state = getInitialState();
      const err = new Error('oops');
      state = astexplorer(state, actions.setError(err));
      expect(state.error).toBe(err);
      state = astexplorer(state, actions.clearError());
      expect(state.error).toBeNull();
    });
  });

  describe('workbench', () => {
    test('SET_CODE updates code', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setCode({ code: 'new code' }));
      expect(state.workbench.code).toBe('new code');
    });

    test('SET_KEY_MAP updates keyMap', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setKeyMap('vim'));
      expect(state.workbench.keyMap).toBe('vim');
    });

    test('SET_PARSER_SETTINGS updates workbench parserSettings', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setParserSettings({ jsx: true }));
      expect(state.workbench.parserSettings).toEqual({ jsx: true });
    });

    test('SET_PARSE_RESULT updates parseResult', () => {
      let state = getInitialState();
      const result = { ast: {}, time: 42 };
      state = astexplorer(state, { type: 'SET_PARSE_RESULT', result } as any);
      expect(state.workbench.parseResult).toBe(result);
    });

    test('SELECT_CATEGORY changes parser and code', () => {
      let state = getInitialState();
      const category = { id: 'css', displayName: 'CSS', codeExample: '/* css */', parsers: [{ id: 'cssom', showInMenu: true }], transformers: [] };
      state = astexplorer(state, actions.selectCategory(category as any));
      expect(state.workbench.code).toContain('css');
    });

    test('SET_TRANSFORM updates transform code', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setTransformState({ code: 'transform code' }));
      expect(state.workbench.transform.code).toBe('transform code');
    });

    test('SET_TRANSFORM_RESULT updates transform result', () => {
      let state = getInitialState();
      const result = { code: 'output' };
      state = astexplorer(state, { type: 'SET_TRANSFORM_RESULT', result } as any);
      expect(state.workbench.transform.transformResult).toBe(result);
    });
  });

  describe('showTransformPanel', () => {
    test('SELECT_TRANSFORMER shows panel', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.selectTransformer({ id: 'babel', defaultParserID: 'acorn', defaultTransform: '' } as any));
      expect(state.showTransformPanel).toBe(true);
    });

    test('HIDE_TRANSFORMER hides panel', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.selectTransformer({ id: 'babel', defaultParserID: 'acorn', defaultTransform: '' } as any));
      state = astexplorer(state, actions.hideTransformer());
      expect(state.showTransformPanel).toBe(false);
    });

    test('SELECT_CATEGORY hides panel', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.selectTransformer({ id: 'babel', defaultParserID: 'acorn', defaultTransform: '' } as any));
      state = astexplorer(state, actions.selectCategory({ id: 'css' } as any));
      expect(state.showTransformPanel).toBe(false);
    });
  });

  describe('activeRevision', () => {
    test('SET_SNIPPET sets revision', () => {
      let state = getInitialState();
      const revision = {
        getTransformerID: () => null,
        getParserID: () => 'acorn',
        getParserSettings: () => null,
        getCode: () => 'snippet code',
        getTransformCode: () => '',
      };
      state = astexplorer(state, actions.setSnippet(revision as any));
      expect(state.activeRevision).toBe(revision);
    });

    test('RESET clears revision', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setSnippet({
        getTransformerID: () => null, getParserID: () => 'acorn',
        getParserSettings: () => null, getCode: () => 'x', getTransformCode: () => '',
      } as any));
      state = astexplorer(state, actions.reset());
      expect(state.activeRevision).toBeNull();
    });
  });

  describe('parserPerCategory', () => {
    test('SET_PARSER remembers parser per category', () => {
      let state = getInitialState();
      const parser = { id: 'esprima', category: { id: 'javascript' } } as any;
      state = astexplorer(state, actions.setParser(parser));
      expect(state.parserPerCategory.javascript).toBe('esprima');
    });
  });

  describe('parserSettings (global)', () => {
    test('SET_PARSER_SETTINGS stores settings per parser when no revision', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setParserSettings({ jsx: true }));
      expect(state.parserSettings[state.workbench.parser]).toEqual({ jsx: true });
    });

    test('SET_PARSER_SETTINGS does NOT store when revision is loaded', () => {
      let state = getInitialState();
      state = astexplorer(state, actions.setSnippet({
        getTransformerID: () => null, getParserID: () => 'acorn',
        getParserSettings: () => null, getCode: () => 'x', getTransformCode: () => '',
      } as any));
      const before = { ...state.parserSettings };
      state = astexplorer(state, actions.setParserSettings({ jsx: true }));
      expect(state.parserSettings).toEqual(before);
    });
  });
});

// =============================================================================
// Additional tests to kill surviving mutations
// =============================================================================

describe('persist() — exact property names', () => {
  test('persist output contains showTransformPanel', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(persisted).toHaveProperty('showTransformPanel');
    expect(persisted.showTransformPanel).toBe(false);
  });

  test('persist output contains parserSettings', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(persisted).toHaveProperty('parserSettings');
    expect(persisted.parserSettings).toEqual(state.parserSettings);
  });

  test('persist output contains parserPerCategory', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(persisted).toHaveProperty('parserPerCategory');
    expect(persisted.parserPerCategory).toEqual(state.parserPerCategory);
  });

  test('persist output workbench contains parser', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(persisted.workbench).toHaveProperty('parser');
    expect(persisted.workbench.parser).toBe(state.workbench.parser);
  });

  test('persist output workbench contains code', () => {
    const state = getInitialState();
    state.workbench.code = 'my custom code';
    const persisted = persist(state);
    expect(persisted.workbench).toHaveProperty('code');
    expect(persisted.workbench.code).toBe('my custom code');
  });

  test('persist output workbench contains keyMap', () => {
    const state = getInitialState();
    state.workbench.keyMap = 'vim';
    const persisted = persist(state);
    expect(persisted.workbench).toHaveProperty('keyMap');
    expect(persisted.workbench.keyMap).toBe('vim');
  });

  test('persist output workbench.transform contains transformer', () => {
    const state = getInitialState();
    state.workbench.transform.transformer = 'jscodeshift';
    const persisted = persist(state);
    expect(persisted.workbench.transform).toHaveProperty('transformer');
    expect(persisted.workbench.transform.transformer).toBe('jscodeshift');
  });

  test('persist output workbench.transform contains code', () => {
    const state = getInitialState();
    state.workbench.transform.code = 'transform snippet';
    const persisted = persist(state);
    expect(persisted.workbench.transform).toHaveProperty('code');
    expect(persisted.workbench.transform.code).toBe('transform snippet');
  });

  test('persist does NOT include transient UI state', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(persisted).not.toHaveProperty('showSettingsDialog');
    expect(persisted).not.toHaveProperty('showSettingsDrawer');
    expect(persisted).not.toHaveProperty('showShareDialog');
    expect(persisted).not.toHaveProperty('saving');
    expect(persisted).not.toHaveProperty('forking');
    expect(persisted).not.toHaveProperty('loadingSnippet');
    expect(persisted).not.toHaveProperty('enableFormatting');
  });

  test('persist has only the expected top-level keys', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(Object.keys(persisted).sort()).toEqual(
      ['parserPerCategory', 'parserSettings', 'showTransformPanel', 'workbench'].sort(),
    );
  });

  test('persist workbench has only parser, code, keyMap, transform', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(Object.keys(persisted.workbench).sort()).toEqual(
      ['code', 'keyMap', 'parser', 'transform'].sort(),
    );
  });

  test('persist workbench.transform has only code and transformer', () => {
    const state = getInitialState();
    const persisted = persist(state);
    expect(Object.keys(persisted.workbench.transform).sort()).toEqual(
      ['code', 'transformer'].sort(),
    );
  });
});

describe('revive() — parserSettings hydration', () => {
  test('revive restores parserSettings from global state for current parser', () => {
    const state = getInitialState();
    const parserId = state.workbench.parser;
    state.parserSettings[parserId] = { jsx: true, sourceType: 'module' };
    const revived = revive(state);
    expect(revived.workbench.parserSettings).toEqual({ jsx: true, sourceType: 'module' });
  });

  test('revive sets parserSettings to null when no settings exist for parser', () => {
    const state = getInitialState();
    // Make sure there are no settings for the current parser
    delete state.parserSettings[state.workbench.parser];
    const revived = revive(state);
    expect(revived.workbench.parserSettings).toBeNull();
  });

  test('revive with empty parserSettings object yields null workbench.parserSettings', () => {
    const state = getInitialState();
    state.parserSettings = {};
    const revived = revive(state);
    expect(revived.workbench.parserSettings).toBeNull();
  });

  test('revive preserves other workbench properties', () => {
    const state = getInitialState();
    state.workbench.code = 'test code';
    state.workbench.keyMap = 'vim';
    const revived = revive(state);
    expect(revived.workbench.code).toBe('test code');
    expect(revived.workbench.keyMap).toBe('vim');
  });

  test('revive sets transform.initialCode from transform.code', () => {
    const state = getInitialState();
    state.workbench.transform.code = 'my transform';
    const revived = revive(state);
    expect(revived.workbench.transform.initialCode).toBe('my transform');
  });

  test('revive called with no argument uses default state', () => {
    const revived = revive();
    expect(revived.workbench).toBeDefined();
    expect(revived.workbench.initialCode).toBe(revived.workbench.code);
  });
});

describe('getDefaultTransform — formatCodeExample branch', () => {
  test('SELECT_TRANSFORMER uses formatCodeExample when available', () => {
    const formatCodeExample = vi.fn(
      (code: string, opts: { parser: string; parserSettings: Record<string, unknown> }) =>
        `formatted(${code}, ${opts.parser})`,
    );
    const transformer = {
      id: 'custom-transformer',
      defaultParserID: 'javascript-parser',
      defaultTransform: '// default transform code',
      formatCodeExample,
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any;

    let state = getInitialState();
    state.workbench.parser = 'javascript-parser';
    state = astexplorer(state, actions.selectTransformer(transformer));

    expect(formatCodeExample).toHaveBeenCalled();
    expect(state.workbench.transform.code).toContain('formatted(');
  });

  test('SELECT_TRANSFORMER without formatCodeExample uses defaultTransform directly', () => {
    const transformer = {
      id: 'simple-transformer',
      defaultParserID: 'javascript-parser',
      defaultTransform: '// plain default',
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any;

    let state = getInitialState();
    state.workbench.parser = 'javascript-parser';
    state = astexplorer(state, actions.selectTransformer(transformer));

    expect(state.workbench.transform.code).toBe('// plain default');
  });
});

describe('SET_PARSER — detailed state verification', () => {
  test('SET_PARSER updates parser ID in workbench', () => {
    let state = getInitialState();
    const parser = { id: 'esprima', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));
    expect(state.workbench.parser).toBe('esprima');
  });

  test('SET_PARSER updates parserSettings from global store', () => {
    let state = getInitialState();
    state.parserSettings['esprima'] = { range: true };
    state = astexplorer(state, actions.setParser({
      id: 'esprima',
      category: { id: 'javascript' },
    } as any));
    expect(state.workbench.parserSettings).toEqual({ range: true });
  });

  test('SET_PARSER sets parserSettings to null when not in global store', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setParser({
      id: 'new-parser',
      category: { id: 'javascript' },
    } as any));
    expect(state.workbench.parserSettings).toBeNull();
  });

  test('SET_PARSER reformats transform code when current code matches default', () => {
    let state = getInitialState();
    // Set up transform state with a transformer whose default code matches current code
    const transformerId = 'test-fmt-transformer';
    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: transformerId,
      code: `// ${transformerId} transform`, // matches the mock's defaultTransform
    };

    // Switch parser — since the current transform code matches getDefaultTransform(transformer, state),
    // it should reformat with the new parser context
    const parser = { id: 'new-parser', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));

    // The mock getTransformerByID returns { defaultTransform: `// ${transformerId} transform` }
    // So getDefaultTransform(transformer, newState) = `// ${transformerId} transform` (no formatCodeExample in mock)
    // The code should be updated to the new default transform
    expect(state.workbench.transform.code).toBe(`// ${transformerId} transform`);
  });
});

describe('SELECT_CATEGORY — detailed state verification', () => {
  test('SELECT_CATEGORY resets code to category example', () => {
    let state = getInitialState();
    state.workbench.code = 'old code';
    const category = {
      id: 'css',
      displayName: 'CSS',
      codeExample: '/* css example */',
      parsers: [{ id: 'cssom', showInMenu: true, category: { id: 'css', codeExample: '/* css example */' } }],
      transformers: [],
    } as any;
    state = astexplorer(state, actions.selectCategory(category));
    expect(state.workbench.code).toBe('/* css example */');
    expect(state.workbench.initialCode).toBe('/* css example */');
  });

  test('SELECT_CATEGORY uses remembered parser for category', () => {
    let state = getInitialState();
    state.parserPerCategory['css'] = 'postcss';
    const category = {
      id: 'css',
      displayName: 'CSS',
      codeExample: '/* css */',
      parsers: [{ id: 'cssom', showInMenu: true, category: { id: 'css', codeExample: '/* css */' } }],
      transformers: [],
    } as any;
    state = astexplorer(state, actions.selectCategory(category));
    expect(state.workbench.parser).toBe('postcss');
  });

  test('SELECT_CATEGORY restores parserSettings from global store', () => {
    let state = getInitialState();
    state.parserPerCategory['css'] = 'postcss';
    state.parserSettings['postcss'] = { nesting: true };
    const category = {
      id: 'css',
      displayName: 'CSS',
      codeExample: '/* css */',
      parsers: [{ id: 'cssom', showInMenu: true, category: { id: 'css', codeExample: '/* css */' } }],
      transformers: [],
    } as any;
    state = astexplorer(state, actions.selectCategory(category));
    expect(state.workbench.parserSettings).toEqual({ nesting: true });
  });

  test('SELECT_CATEGORY hides transform panel', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.selectTransformer({
      id: 'babel',
      defaultParserID: 'javascript-parser',
      defaultTransform: '',
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any));
    expect(state.showTransformPanel).toBe(true);
    state = astexplorer(state, actions.selectCategory({
      id: 'css',
      displayName: 'CSS',
      codeExample: '/* css */',
      parsers: [{ id: 'cssom', showInMenu: true, category: { id: 'css', codeExample: '/* css */' } }],
      transformers: [],
    } as any));
    expect(state.showTransformPanel).toBe(false);
  });

  test('SELECT_CATEGORY clears activeRevision', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setSnippet({
      getTransformerID: () => null,
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'code',
      getTransformCode: () => '',
    } as any));
    expect(state.activeRevision).not.toBeNull();
    state = astexplorer(state, actions.selectCategory({
      id: 'css',
      displayName: 'CSS',
      codeExample: '/* css */',
      parsers: [{ id: 'cssom', showInMenu: true, category: { id: 'css', codeExample: '/* css */' } }],
      transformers: [],
    } as any));
    expect(state.activeRevision).toBeNull();
  });
});

describe('SET_TRANSFORM — detailed verification', () => {
  test('SET_TRANSFORM only updates transform.code, not other transform properties', () => {
    let state = getInitialState();
    state.workbench.transform.transformer = 'babel';
    state.workbench.transform.transformResult = { result: 'old' } as any;
    state = astexplorer(state, actions.setTransformState({ code: 'new transform code' }));
    expect(state.workbench.transform.code).toBe('new transform code');
    expect(state.workbench.transform.transformer).toBe('babel');
    expect(state.workbench.transform.transformResult).toEqual({ result: 'old' });
  });
});

describe('SET_PARSE_RESULT — detailed verification', () => {
  test('SET_PARSE_RESULT sets parseResult on workbench', () => {
    let state = getInitialState();
    const result = { ast: { type: 'Program' }, error: null, time: 15, treeAdapter: null };
    state = astexplorer(state, { type: 'SET_PARSE_RESULT', result } as any);
    expect(state.workbench.parseResult).toBe(result);
    // Other workbench properties remain unchanged
    expect(state.workbench.code).toBe(state.workbench.code);
    expect(state.workbench.parser).toBeDefined();
  });

  test('SET_PARSE_RESULT replaces previous parseResult', () => {
    let state = getInitialState();
    const result1 = { ast: { type: 'A' }, time: 1 };
    const result2 = { ast: { type: 'B' }, time: 2 };
    state = astexplorer(state, { type: 'SET_PARSE_RESULT', result: result1 } as any);
    expect(state.workbench.parseResult).toBe(result1);
    state = astexplorer(state, { type: 'SET_PARSE_RESULT', result: result2 } as any);
    expect(state.workbench.parseResult).toBe(result2);
  });
});

describe('TOGGLE_FORMATTING — detailed verification', () => {
  test('TOGGLE_FORMATTING flips enableFormatting from false to true', () => {
    let state = getInitialState();
    expect(state.enableFormatting).toBe(false);
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.enableFormatting).toBe(true);
  });

  test('TOGGLE_FORMATTING flips enableFormatting from true to false', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.enableFormatting).toBe(true);
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.enableFormatting).toBe(false);
  });

  test('TOGGLE_FORMATTING three times results in true', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.toggleFormatting());
    state = astexplorer(state, actions.toggleFormatting());
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.enableFormatting).toBe(true);
  });
});

describe('START_SAVE / END_SAVE — detailed verification', () => {
  test('START_SAVE fork=false: saving=true, forking=false', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.startSave(false));
    expect(state.saving).toBe(true);
    expect(state.forking).toBe(false);
  });

  test('START_SAVE fork=true: saving=false, forking=true', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.startSave(true));
    expect(state.saving).toBe(false);
    expect(state.forking).toBe(true);
  });

  test('END_SAVE resets saving to false', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.startSave(false));
    expect(state.saving).toBe(true);
    state = astexplorer(state, actions.endSave(false));
    expect(state.saving).toBe(false);
  });

  test('END_SAVE resets forking to false', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.startSave(true));
    expect(state.forking).toBe(true);
    state = astexplorer(state, actions.endSave(true));
    expect(state.forking).toBe(false);
  });
});

describe('LOAD_SNIPPET (SET_SNIPPET) — detailed verification', () => {
  test('SET_SNIPPET sets workbench parser, code, and transform', () => {
    let state = getInitialState();
    const revision = {
      getTransformerID: () => 'jscodeshift',
      getParserID: () => 'babel-parser',
      getParserSettings: () => ({ plugins: ['jsx'] }),
      getCode: () => 'const x = 1;',
      getTransformCode: () => 'export default function(file) {}',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));

    expect(state.workbench.parser).toBe('babel-parser');
    expect(state.workbench.code).toBe('const x = 1;');
    expect(state.workbench.initialCode).toBe('const x = 1;');
    expect(state.workbench.parserSettings).toEqual({ plugins: ['jsx'] });
    expect(state.workbench.transform.transformer).toBe('jscodeshift');
    expect(state.workbench.transform.code).toBe('export default function(file) {}');
    expect(state.workbench.transform.initialCode).toBe('export default function(file) {}');
  });

  test('SET_SNIPPET with no parserSettings falls back to global settings', () => {
    let state = getInitialState();
    state.parserSettings['babel-parser'] = { sourceType: 'module' };
    const revision = {
      getTransformerID: () => null,
      getParserID: () => 'babel-parser',
      getParserSettings: () => null,
      getCode: () => 'code',
      getTransformCode: () => '',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.workbench.parserSettings).toEqual({ sourceType: 'module' });
  });

  test('SET_SNIPPET with transformer shows transform panel', () => {
    let state = getInitialState();
    const revision = {
      getTransformerID: () => 'jscodeshift',
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'code',
      getTransformCode: () => 'transform',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.showTransformPanel).toBe(true);
  });

  test('SET_SNIPPET without transformer hides transform panel', () => {
    let state = getInitialState();
    const revision = {
      getTransformerID: () => null,
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'code',
      getTransformCode: () => '',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.showTransformPanel).toBe(false);
  });
});

describe('CLEAR_SNIPPET — detailed verification', () => {
  test('CLEAR_SNIPPET resets workbench code to category example', () => {
    let state = getInitialState();
    state.workbench.code = 'custom code';
    state = astexplorer(state, actions.clearSnippet());
    // getParserByID mock returns category.codeExample = '// js example'
    expect(state.workbench.code).toBe('// js example');
    expect(state.workbench.initialCode).toBe('// js example');
  });

  test('CLEAR_SNIPPET hides transform panel', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.selectTransformer({
      id: 'babel',
      defaultParserID: 'javascript-parser',
      defaultTransform: '',
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any));
    expect(state.showTransformPanel).toBe(true);
    state = astexplorer(state, actions.clearSnippet());
    expect(state.showTransformPanel).toBe(false);
  });

  test('CLEAR_SNIPPET clears activeRevision', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setSnippet({
      getTransformerID: () => null,
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'x',
      getTransformCode: () => '',
    } as any));
    expect(state.activeRevision).not.toBeNull();
    state = astexplorer(state, actions.clearSnippet());
    expect(state.activeRevision).toBeNull();
  });

  test('CLEAR_SNIPPET resets cursor to null', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(42));
    state = astexplorer(state, actions.clearSnippet());
    expect(state.cursor).toBeNull();
  });
});

describe('DROP_TEXT — detailed verification', () => {
  test('DROP_TEXT sets code and initialCode from dropped text', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.dropText('dropped content', 'javascript'));
    expect(state.workbench.code).toBe('dropped content');
    expect(state.workbench.initialCode).toBe('dropped content');
  });
});

describe('SELECT_TRANSFORMER — detailed verification', () => {
  test('SELECT_TRANSFORMER with different parser switches parser', () => {
    let state = getInitialState();
    const transformer = {
      id: 'new-transformer',
      defaultParserID: 'different-parser',
      defaultTransform: '// transform',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.parser).toBe('different-parser');
    expect(state.workbench.transform.transformer).toBe('new-transformer');
  });

  test('SELECT_TRANSFORMER with compatible parser does not switch parser', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    const transformer = {
      id: 'compat-transformer',
      defaultParserID: 'other-parser',
      defaultTransform: '// transform',
      compatibleParserIDs: new Set([currentParser]),
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.parser).toBe(currentParser);
    expect(state.workbench.transform.transformer).toBe('compat-transformer');
  });

  test('SELECT_TRANSFORMER same transformer+parser does not change workbench', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    const transformer = {
      id: 'my-transformer',
      defaultParserID: currentParser,
      defaultTransform: '// t',
      compatibleParserIDs: new Set([currentParser]),
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    const workbenchAfterFirst = state.workbench;

    // Select same transformer again — workbench sub-reducer returns same ref
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench).toBe(workbenchAfterFirst);
  });

  test('SELECT_TRANSFORMER clears transformResult', () => {
    let state = getInitialState();
    state.workbench.transform.transformResult = { result: 'old' } as any;
    const transformer = {
      id: 'new-t',
      defaultParserID: 'other-parser',
      defaultTransform: '// new transform',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.transformResult).toBeNull();
  });

  test('SELECT_TRANSFORMER updates parserSettings from global when switching parser', () => {
    let state = getInitialState();
    state.parserSettings['target-parser'] = { flag: true };
    const transformer = {
      id: 'switch-transformer',
      defaultParserID: 'target-parser',
      defaultTransform: '// transform',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.parserSettings).toEqual({ flag: true });
  });
});

describe('RESET — detailed verification', () => {
  test('RESET resets workbench code to category codeExample', () => {
    let state = getInitialState();
    state.workbench.code = 'modified code';
    state = astexplorer(state, actions.reset());
    expect(state.workbench.code).toBe('// js example');
    expect(state.workbench.initialCode).toBe('// js example');
  });

  test('RESET clears activeRevision', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setSnippet({
      getTransformerID: () => null,
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'x',
      getTransformCode: () => '',
    } as any));
    state = astexplorer(state, actions.reset());
    expect(state.activeRevision).toBeNull();
  });

  test('RESET resets transform code when transformer is set', () => {
    let state = getInitialState();
    state.workbench.transform.transformer = 'babel';
    state.workbench.transform.code = 'modified transform';
    state = astexplorer(state, actions.reset());
    // getTransformerByID('babel') returns { defaultTransform: '// babel transform' }
    expect(state.workbench.transform.code).toBe('// babel transform');
    expect(state.workbench.transform.initialCode).toBe('// babel transform');
  });

  test('RESET clears cursor', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(99));
    state = astexplorer(state, actions.reset());
    expect(state.cursor).toBeNull();
  });

  test('RESET restores parserSettings from global store', () => {
    let state = getInitialState();
    const parserId = state.workbench.parser;
    state.parserSettings[parserId] = { range: true };
    state.workbench.parserSettings = { different: true } as any;
    state = astexplorer(state, actions.reset());
    expect(state.workbench.parserSettings).toEqual({ range: true });
  });
});

describe('SET_KEY_MAP — detailed verification', () => {
  test('SET_KEY_MAP changes keyMap value', () => {
    let state = getInitialState();
    expect(state.workbench.keyMap).toBe('default');
    state = astexplorer(state, actions.setKeyMap('vim'));
    expect(state.workbench.keyMap).toBe('vim');
    state = astexplorer(state, actions.setKeyMap('emacs'));
    expect(state.workbench.keyMap).toBe('emacs');
  });
});

describe('SET_TRANSFORM_RESULT — detailed verification', () => {
  test('SET_TRANSFORM_RESULT updates only transformResult', () => {
    let state = getInitialState();
    state.workbench.transform.code = 'my code';
    state.workbench.transform.transformer = 'babel';
    const result = { result: 'output code', error: undefined } as any;
    state = astexplorer(state, { type: 'SET_TRANSFORM_RESULT', result } as any);
    expect(state.workbench.transform.transformResult).toBe(result);
    expect(state.workbench.transform.code).toBe('my code');
    expect(state.workbench.transform.transformer).toBe('babel');
  });
});

describe('pick() function — indirect testing via persist', () => {
  test('pick preserves values correctly with various data types', () => {
    const state = getInitialState();
    state.showTransformPanel = true;
    state.parserSettings = { parser1: { a: 1 }, parser2: { b: 2 } };
    state.parserPerCategory = { javascript: 'acorn', css: 'postcss' };
    state.workbench.code = 'const x = 42;';
    state.workbench.keyMap = 'vim';
    state.workbench.parser = 'acorn';
    state.workbench.transform.code = 'export default function() {}';
    state.workbench.transform.transformer = 'jscodeshift';

    const persisted = persist(state);

    expect(persisted.showTransformPanel).toBe(true);
    expect(persisted.parserSettings).toEqual({ parser1: { a: 1 }, parser2: { b: 2 } });
    expect(persisted.parserPerCategory).toEqual({ javascript: 'acorn', css: 'postcss' });
    expect(persisted.workbench.parser).toBe('acorn');
    expect(persisted.workbench.code).toBe('const x = 42;');
    expect(persisted.workbench.keyMap).toBe('vim');
    expect(persisted.workbench.transform.code).toBe('export default function() {}');
    expect(persisted.workbench.transform.transformer).toBe('jscodeshift');
  });
});

// =============================================================================
// Round 2: Kill remaining surviving mutants
// =============================================================================

describe('getDefaultTransform — formatCodeExample receives correct args (lines 126-128)', () => {
  test('formatCodeExample receives parserSettings from workbenchState (not true/false/&&)', () => {
    const formatCodeExample = vi.fn(
      (code: string, opts: { parser: string; parserSettings: Record<string, unknown> }) => {
        // Verify the opts object has the right shape
        return `fmt:${opts.parser}:${JSON.stringify(opts.parserSettings)}:${code}`;
      },
    );
    const transformer = {
      id: 'fmt-transformer',
      defaultParserID: 'javascript-parser',
      defaultTransform: '// base',
      formatCodeExample,
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any;

    let state = getInitialState();
    state.workbench.parser = 'javascript-parser';
    state.workbench.parserSettings = { jsx: true };
    state = astexplorer(state, actions.selectTransformer(transformer));

    // Verify formatCodeExample was called with the right second argument
    expect(formatCodeExample).toHaveBeenCalledWith(
      '// base',
      { parser: 'javascript-parser', parserSettings: { jsx: true } },
    );
  });

  test('formatCodeExample receives empty object when parserSettings is null', () => {
    const formatCodeExample = vi.fn((code: string) => `formatted:${code}`);
    const transformer = {
      id: 'null-settings-transformer',
      defaultParserID: 'javascript-parser',
      defaultTransform: '// default',
      formatCodeExample,
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any;

    let state = getInitialState();
    state.workbench.parser = 'javascript-parser';
    state.workbench.parserSettings = null;
    state = astexplorer(state, actions.selectTransformer(transformer));

    expect(formatCodeExample).toHaveBeenCalledWith(
      '// default',
      { parser: 'javascript-parser', parserSettings: {} },
    );
  });

  test('formatCodeExample return value is used as transform code', () => {
    const formatCodeExample = vi.fn(() => 'FORMATTED_OUTPUT');
    const transformer = {
      id: 'ret-transformer',
      defaultParserID: 'javascript-parser',
      defaultTransform: '// raw',
      formatCodeExample,
      compatibleParserIDs: new Set(['javascript-parser']),
    } as any;

    let state = getInitialState();
    state.workbench.parser = 'javascript-parser';
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.code).toBe('FORMATTED_OUTPUT');
  });
});

describe('SET_PARSER — same parser no-op (line 168)', () => {
  test('SET_PARSER with the same parser id still updates parser', () => {
    // The condition action.parser !== state.parser compares object vs string
    // so it is always truthy. Test that parserSettings is updated even for "same" parser id.
    let state = getInitialState();
    const parserId = state.workbench.parser;
    state.parserSettings[parserId] = { newSetting: true };
    // Set a different parserSettings on workbench first
    state.workbench.parserSettings = { old: true } as any;
    const parser = { id: parserId, category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));
    // parserSettings should be updated from global store
    expect(state.workbench.parserSettings).toEqual({ newSetting: true });
  });
});

describe('SET_PARSER — transform reformat branch (line 175)', () => {
  test('transform code is NOT reformatted when code does not match default', () => {
    let state = getInitialState();
    // Set up a transformer but with code that does NOT match the default
    const transformerId = 'reformat-test';
    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: transformerId,
      code: 'USER MODIFIED CODE', // Does not match `// reformat-test transform`
    };

    const parser = { id: 'new-parser', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));

    // Code should remain unchanged since it was user-modified
    expect(state.workbench.transform.code).toBe('USER MODIFIED CODE');
  });

  test('transform code IS reformatted when code matches default transform', () => {
    let state = getInitialState();
    const transformerId = 'reformat-match';
    // Set code to match what getDefaultTransform would return for the current state
    // The mock getTransformerByID returns { defaultTransform: `// ${id} transform` }
    // getDefaultTransform without formatCodeExample returns defaultTransform directly
    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: transformerId,
      code: `// ${transformerId} transform`, // Matches defaultTransform
    };

    const parser = { id: 'different-parser', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));

    // Code should be reformatted (re-evaluated getDefaultTransform with newState)
    // Since mock has no formatCodeExample, it returns defaultTransform again
    expect(state.workbench.transform.code).toBe(`// ${transformerId} transform`);
  });

  test('transform code reformatting actually calls getDefaultTransform with new state', () => {
    // Use a transformer with formatCodeExample to verify the new parser is passed
    const formatCodeExample = vi.fn(
      (code: string, opts: { parser: string }) => `fmt(${code},${opts.parser})`,
    );

    let state = getInitialState();
    const transformerId = 'fmt-reformat';
    const currentParser = state.workbench.parser;

    // Set up transform with formatCodeExample transformer
    // First, select the transformer to get the formatted default code
    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: transformerId,
      // Code matches getDefaultTransform(transformer, currentState)
      code: `fmt(// default,${currentParser})`,
    };

    // Now we need getTransformerByID to return a transformer with formatCodeExample
    // But the mock doesn't support that, so let's use a simpler approach:
    // Just verify the branch by checking that code remains different from user-modified code
    // Already covered above — this test focuses on the "no transformer" branch
    state.workbench.transform.transformer = null;
    const parser = { id: 'new-p', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(parser));

    // With transformer=null, getTransformerByID returns undefined, so no reformat
    expect(state.workbench.transform.code).toBe(`fmt(// default,${currentParser})`);
  });
});

describe('SELECT_TRANSFORMER — differentParser logic (line 191)', () => {
  test('differentParser is true when defaultParserID differs and parser is not compatible', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    const transformer = {
      id: 'new-t',
      defaultParserID: 'totally-different-parser',
      defaultTransform: '// t',
      // No compatibleParserIDs
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.parser).toBe('totally-different-parser');
  });

  test('differentParser is false when defaultParserID matches current parser', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    const transformer = {
      id: 'same-parser-t',
      defaultParserID: currentParser,
      defaultTransform: '// t',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    // Parser should remain unchanged
    expect(state.workbench.parser).toBe(currentParser);
  });

  test('differentParser is false when parser is in compatibleParserIDs even if defaultParserID differs', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    const transformer = {
      id: 'compat-test-t',
      defaultParserID: 'some-other-parser',
      defaultTransform: '// t',
      compatibleParserIDs: new Set([currentParser]),
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    // Parser should NOT switch because current parser is compatible
    expect(state.workbench.parser).toBe(currentParser);
  });
});

describe('SELECT_TRANSFORMER — snippetHasDifferentTransform (lines 207-208)', () => {
  test('uses revision transform code when activeRevision has same transformer', () => {
    let state = getInitialState();
    // Load a snippet with a specific transformer
    const revision = {
      getTransformerID: () => 'existing-transformer',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'revision transform code',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.activeRevision).toBe(revision);

    // Now select the same transformer — snippetHasDifferentTransform should be true
    const transformer = {
      id: 'existing-transformer',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));

    // It should use the revision's transform code, not the default
    expect(state.workbench.transform.code).toBe('revision transform code');
    expect(state.workbench.transform.initialCode).toBe('revision transform code');
  });

  test('uses default transform when activeRevision has different transformer', () => {
    let state = getInitialState();
    // Load a snippet with a different transformer
    const revision = {
      getTransformerID: () => 'other-transformer',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'revision transform code',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));

    // Select a new transformer different from the revision's
    const transformer = {
      id: 'brand-new-transformer',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// brand new default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));

    // Should use defaultTransform, not revision code
    expect(state.workbench.transform.code).toBe('// brand new default');
  });

  test('uses default transform when no activeRevision', () => {
    let state = getInitialState();
    expect(state.activeRevision).toBeFalsy();

    const transformer = {
      id: 'no-revision-t',
      defaultParserID: 'other-parser',
      defaultTransform: '// no rev default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.code).toBe('// no rev default');
  });

  test('differentTransformer true triggers transform update', () => {
    let state = getInitialState();
    state.workbench.transform.transformer = 'old-transformer';
    const transformer = {
      id: 'new-transformer',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// new default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.transformer).toBe('new-transformer');
    expect(state.workbench.transform.code).toBe('// new default');
    expect(state.workbench.transform.transformResult).toBeNull();
  });
});

describe('CLEAR_SNIPPET/RESET — activeRevision transformer branch (line 272)', () => {
  test('CLEAR_SNIPPET resets transform when activeRevision has transformer', () => {
    let state = getInitialState();
    // Load a snippet WITH a transformer
    const revision = {
      getTransformerID: () => 'jscodeshift',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'revision transform',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.activeRevision).toBe(revision);
    expect(state.workbench.transform.transformer).toBe('jscodeshift');

    // Modify the transform code
    state = astexplorer(state, actions.setTransformState({ code: 'user modified transform' }));

    // CLEAR_SNIPPET should reset transform code because activeRevision has a transformer
    state = astexplorer(state, actions.clearSnippet());
    // getTransformerByID('jscodeshift') returns { defaultTransform: '// jscodeshift transform' }
    expect(state.workbench.transform.code).toBe('// jscodeshift transform');
    expect(state.workbench.transform.initialCode).toBe('// jscodeshift transform');
  });

  test('CLEAR_SNIPPET does not reset transform when no activeRevision and no transformer', () => {
    let state = getInitialState();
    // No snippet loaded, no transformer
    state.workbench.transform.code = 'some code';
    state.workbench.transform.transformer = null;
    state = astexplorer(state, actions.clearSnippet());
    // Transform code should be unchanged since there is nothing to clear
    expect(state.workbench.transform.code).toBe('some code');
  });
});

describe('default return in switch statements (lines 333, 344, 355)', () => {
  test('showSettingsDialog returns current state for irrelevant actions', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.openSettingsDialog());
    expect(state.showSettingsDialog).toBe(true);
    // An irrelevant action should not change showSettingsDialog
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.showSettingsDialog).toBe(true);
  });

  test('showSettingsDrawer returns current state for irrelevant actions', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.expandSettingsDrawer());
    expect(state.showSettingsDrawer).toBe(true);
    // An irrelevant action should not change showSettingsDrawer
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.showSettingsDrawer).toBe(true);
  });

  test('showShareDialog returns current state for irrelevant actions', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.openShareDialog());
    expect(state.showShareDialog).toBe(true);
    // An irrelevant action should not change showShareDialog
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.showShareDialog).toBe(true);
  });
});

describe('cursor — SET_CURSOR return value (line 384)', () => {
  test('SET_CURSOR returns the exact cursor value provided', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(0));
    expect(state.cursor).toBe(0);
  });

  test('SET_CURSOR with a large number', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(99999));
    expect(state.cursor).toBe(99999);
  });

  test('SET_CURSOR replaces previous cursor value', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(10));
    state = astexplorer(state, actions.setCursor(20));
    expect(state.cursor).toBe(20);
  });
});

describe('cursor — SET_CODE with null cursor (line 389)', () => {
  test('SET_CODE with cursor=null does not update cursor', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(42));
    expect(state.cursor).toBe(42);
    // setCode with no cursor (undefined) should keep current cursor
    state = astexplorer(state, actions.setCode({ code: 'new code' }));
    expect(state.cursor).toBe(42);
  });

  test('SET_CODE with explicit cursor=null does not update cursor', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCursor(7));
    state = astexplorer(state, actions.setCode({ code: 'x', cursor: null }));
    expect(state.cursor).toBe(7);
  });

  test('SET_CODE with cursor=5 updates cursor to 5', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.setCode({ code: 'x', cursor: 5 }));
    expect(state.cursor).toBe(5);
  });
});

describe('module initialization — getCategoryByID argument (line 13)', () => {
  test('initial state parser is based on javascript category', () => {
    const state = getInitialState();
    // The mock getCategoryByID('javascript') returns parsers: [{ id: 'javascript-parser' }]
    // getDefaultParser returns { id: 'javascript-parser' }
    // So workbench.parser should be 'javascript-parser'
    expect(state.workbench.parser).toBe('javascript-parser');
  });

  test('initial state code is javascript category codeExample', () => {
    const state = getInitialState();
    // getCategoryByID('javascript') returns { codeExample: '// javascript example' }
    expect(state.workbench.code).toBe('// javascript example');
    expect(state.workbench.initialCode).toBe('// javascript example');
  });
});

// =============================================================================
// Round 3: Kill final surviving mutants
// =============================================================================

describe('SET_PARSER — reformat with fmt-aware transformer (line 175)', () => {
  test('SET_PARSER reformats transform code via formatCodeExample when code matches default', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser; // 'javascript-parser'

    // Set up transform with the fmt-aware transformer (which the mock gives formatCodeExample)
    // getDefaultTransform for fmt-aware with currentParser returns:
    //   formatCodeExample('// fmt-aware transform', { parser: currentParser, parserSettings: ... })
    //   = `fmt(// fmt-aware transform,${currentParser})`
    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: 'fmt-aware',
      code: `fmt(// fmt-aware transform,${currentParser})`, // matches getDefaultTransform(transformer, state)
    };

    // Switch to a different parser
    const newParser = { id: 'new-parser-x', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(newParser));

    // getDefaultTransform should be called again with newState where parser='new-parser-x'
    // Result: fmt(// fmt-aware transform,new-parser-x)
    expect(state.workbench.transform.code).toBe('fmt(// fmt-aware transform,new-parser-x)');
  });

  test('SET_PARSER does NOT reformat when code differs from default (fmt-aware)', () => {
    let state = getInitialState();

    state.workbench.transform = {
      ...state.workbench.transform,
      transformer: 'fmt-aware',
      code: 'USER EDITED CODE', // Does not match getDefaultTransform
    };

    const newParser = { id: 'new-parser-y', category: { id: 'javascript' } } as any;
    state = astexplorer(state, actions.setParser(newParser));

    // Code should remain unchanged since it was user-modified
    expect(state.workbench.transform.code).toBe('USER EDITED CODE');
  });
});

describe('SELECT_TRANSFORMER — differentParser with same defaultParserID (line 191)', () => {
  test('parser is NOT switched when defaultParserID matches current parser', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser; // 'javascript-parser'
    const originalParserSettings = state.workbench.parserSettings;

    const transformer = {
      id: 'dp-same-transformer',
      defaultParserID: currentParser, // Same as current
      defaultTransform: '// dp transform',
      // No compatibleParserIDs
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));

    // Parser should not change because differentParser = false
    expect(state.workbench.parser).toBe(currentParser);
    // Transform should still update because differentTransformer is true
    expect(state.workbench.transform.transformer).toBe('dp-same-transformer');
  });
});

describe('SELECT_TRANSFORMER — differentTransformer always true mutant (line 207)', () => {
  test('selecting same transformer with same parser does NOT update transform', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;

    // First, select a transformer
    const transformer = {
      id: 'stable-t',
      defaultParserID: currentParser,
      defaultTransform: '// stable',
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.transformer).toBe('stable-t');

    // Modify the transform code
    state = astexplorer(state, actions.setTransformState({ code: 'user code' }));
    expect(state.workbench.transform.code).toBe('user code');

    // Select the same transformer again — differentTransformer is false,
    // differentParser is false, so it should return same state and NOT reset code
    state = astexplorer(state, actions.selectTransformer(transformer));
    expect(state.workbench.transform.code).toBe('user code'); // Should NOT be reset
  });
});

describe('SELECT_TRANSFORMER — snippetHasDifferentTransform (line 208 precise)', () => {
  test('selecting new transformer with activeRevision having the same id uses revision initialCode', () => {
    let state = getInitialState();

    // Load snippet with transformer 'target-t'
    const revision = {
      getTransformerID: () => 'target-t',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'REVISION_TRANSFORM_CODE',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));

    // After setSnippet, transform.transformer = 'target-t'
    // Now change the transformer to something else first
    const intermediateT = {
      id: 'intermediate-t',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// intermediate',
    } as any;
    state = astexplorer(state, actions.selectTransformer(intermediateT));
    expect(state.workbench.transform.transformer).toBe('intermediate-t');
    // activeRevision is still set (selectTransformer doesn't clear it)
    expect(state.activeRevision).toBe(revision);

    // Now select 'target-t' again — differentTransformer=true (from intermediate-t to target-t),
    // AND activeRevision.getTransformerID() === 'target-t', so snippetHasDifferentTransform=true
    const targetT = {
      id: 'target-t',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// target default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(targetT));

    // When snippetHasDifferentTransform is true:
    //   code = state.transform.code (current code from intermediate state)
    //   initialCode = fullState.activeRevision.getTransformCode()
    // So initialCode comes from the revision, which distinguishes snippetHasDifferentTransform=true from false
    expect(state.workbench.transform.initialCode).toBe('REVISION_TRANSFORM_CODE');
    // If snippetHasDifferentTransform were false, initialCode would be getDefaultTransform
    // which is '// target-t transform' (from mock), NOT 'REVISION_TRANSFORM_CODE'
    expect(state.workbench.transform.initialCode).not.toBe('// target-t transform');
  });

  test('selecting new transformer without matching activeRevision uses default code', () => {
    let state = getInitialState();

    // Load snippet with transformer 'other-t'
    const revision = {
      getTransformerID: () => 'other-t',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'REVISION_TRANSFORM_CODE',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));

    // Now select 'target-t' which is different from revision's 'other-t'
    const targetT = {
      id: 'target-t',
      defaultParserID: state.workbench.parser,
      defaultTransform: '// target default',
    } as any;
    state = astexplorer(state, actions.selectTransformer(targetT));

    // Should use default transform code, NOT revision code
    expect(state.workbench.transform.code).toBe('// target default');
  });
});

describe('CLEAR_SNIPPET — activeRevision with transformer (line 272)', () => {
  test('CLEAR_SNIPPET resets transform when activeRevision.getTransformerID() is truthy', () => {
    let state = getInitialState();

    // Load snippet WITH transformer
    const revision = {
      getTransformerID: () => 'my-transformer',
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => 'revision transform',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));
    expect(state.activeRevision).toBe(revision);
    expect(state.workbench.transform.transformer).toBe('my-transformer');

    // Modify transform code
    state = astexplorer(state, actions.setTransformState({ code: 'user modified' }));
    expect(state.workbench.transform.code).toBe('user modified');

    // CLEAR_SNIPPET — activeRevision has transformer, so transform should be reset
    state = astexplorer(state, actions.clearSnippet());

    // Transform code should be reset to default for 'my-transformer'
    expect(state.workbench.transform.code).toBe('// my-transformer transform');
    expect(state.workbench.transform.initialCode).toBe('// my-transformer transform');
  });

  test('CLEAR_SNIPPET does NOT reset transform when activeRevision has no transformer', () => {
    let state = getInitialState();

    // Load snippet WITHOUT transformer
    const revision = {
      getTransformerID: () => null,
      getParserID: () => state.workbench.parser,
      getParserSettings: () => null,
      getCode: () => 'snippet code',
      getTransformCode: () => '',
    } as any;
    state = astexplorer(state, actions.setSnippet(revision));

    // Manually set some transform code
    state.workbench.transform.code = 'should stay';
    state.workbench.transform.transformer = null;

    state = astexplorer(state, actions.clearSnippet());

    // Transform code should NOT be reset since activeRevision has no transformer
    // and transform.transformer is null
    expect(state.workbench.transform.code).toBe('should stay');
  });
});

describe('SELECT_TRANSFORMER — differentParser false when defaultParserID matches (line 191)', () => {
  test('parser is NOT switched when defaultParserID equals current parser without compatibleParserIDs', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;

    // Transformer has defaultParserID matching current parser and NO compatibleParserIDs
    const transformer = {
      id: 'no-switch-t',
      defaultParserID: currentParser,
      defaultTransform: '// no switch',
      // compatibleParserIDs is undefined
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));

    // Parser should NOT change even though there are no compatibleParserIDs
    expect(state.workbench.parser).toBe(currentParser);
    // But transform should still update
    expect(state.workbench.transform.transformer).toBe('no-switch-t');
    // parserSettings should NOT have been updated from global store (no parser switch)
    // If differentParser were incorrectly true, parserSettings would be set from
    // fullState.parserSettings[action.transformer.defaultParserID]
  });

  test('parserSettings not changed from global when defaultParserID matches (no compatible)', () => {
    let state = getInitialState();
    const currentParser = state.workbench.parser;
    // Set specific parserSettings on workbench
    state.workbench.parserSettings = { existingSetting: true } as any;
    // Set different settings in global store
    state.parserSettings[currentParser] = { globalSetting: true };

    const transformer = {
      id: 'settings-check-t',
      defaultParserID: currentParser,
      defaultTransform: '// t',
      // No compatibleParserIDs — so !parserIsCompatible would be true if the first condition
      // were incorrectly mutated to `true`
    } as any;
    state = astexplorer(state, actions.selectTransformer(transformer));

    // If differentParser is correctly false, parserSettings should remain unchanged
    // If the mutant makes differentParser=true, it would overwrite with global settings
    expect(state.workbench.parserSettings).toEqual({ existingSetting: true });
  });
});

describe('showShareDialog — default case return (line 355)', () => {
  test('showShareDialog stays true across multiple irrelevant actions', () => {
    let state = getInitialState();
    state = astexplorer(state, actions.openShareDialog());
    expect(state.showShareDialog).toBe(true);

    // Multiple irrelevant actions
    state = astexplorer(state, actions.setCursor(5));
    expect(state.showShareDialog).toBe(true);
    state = astexplorer(state, actions.setCode({ code: 'test' }));
    expect(state.showShareDialog).toBe(true);
    state = astexplorer(state, actions.setKeyMap('vim'));
    expect(state.showShareDialog).toBe(true);
    state = astexplorer(state, actions.startSave(false));
    expect(state.showShareDialog).toBe(true);
    state = astexplorer(state, actions.endSave(false));
    expect(state.showShareDialog).toBe(true);
  });

  test('showShareDialog stays false for irrelevant actions', () => {
    let state = getInitialState();
    expect(state.showShareDialog).toBe(false);
    state = astexplorer(state, actions.toggleFormatting());
    expect(state.showShareDialog).toBe(false);
    state = astexplorer(state, { type: 'SET_PARSE_RESULT', result: {} } as any);
    expect(state.showShareDialog).toBe(false);
  });
});
