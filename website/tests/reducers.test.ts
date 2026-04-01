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
  getTransformerByID: (id: string) => (id ? {
    id,
    displayName: id,
    defaultTransform: `// ${id} transform`,
    defaultParserID: 'acorn',
  } : undefined),
}));

import { astexplorer, persist, revive } from '../src/store/reducers';
import * as actions from '../src/store/actions';

function getInitialState() {
  return astexplorer(undefined as any, { type: 'INIT' } as any);
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
