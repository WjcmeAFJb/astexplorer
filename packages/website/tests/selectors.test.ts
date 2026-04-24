import { describe, test, expect, vi } from 'vitest';

// Mock astexplorer-parsers before importing selectors
vi.mock('astexplorer-parsers', () => ({
  getParserByID: (id: string) => ({ id, showInMenu: true, hasSettings: () => false }),
  getTransformerByID: (id: string) => (id ? { id } : undefined),
}));

import * as selectors from '../src/store/selectors';

function makeState(overrides: Record<string, unknown> = {}): any {
  return {
    enableFormatting: false,
    cursor: null,
    error: null,
    loadingSnippet: false,
    showSettingsDialog: false,
    showSettingsDrawer: false,
    showShareDialog: false,
    forking: false,
    saving: false,
    showTransformPanel: false,
    activeRevision: null,
    workbench: {
      parser: 'acorn',
      parserSettings: null,
      parseResult: undefined,
      code: 'const x = 1;',
      initialCode: 'const x = 1;',
      keyMap: 'default',
      transform: {
        transformer: '',
        code: '',
        initialCode: '',
        transformResult: null,
      },
    },
    ...overrides,
  };
}

describe('selectors', () => {
  test('getFormattingState', () => {
    expect(selectors.getFormattingState(makeState({ enableFormatting: true }))).toBe(true);
    expect(selectors.getFormattingState(makeState({ enableFormatting: false }))).toBe(false);
  });

  test('getCursor', () => {
    expect(selectors.getCursor(makeState({ cursor: 42 }))).toBe(42);
    expect(selectors.getCursor(makeState({ cursor: null }))).toBeNull();
  });

  test('getError', () => {
    const err = new Error('test');
    expect(selectors.getError(makeState({ error: err }))).toBe(err);
    expect(selectors.getError(makeState())).toBeNull();
  });

  test('isLoadingSnippet', () => {
    expect(selectors.isLoadingSnippet(makeState({ loadingSnippet: true }))).toBe(true);
    expect(selectors.isLoadingSnippet(makeState())).toBe(false);
  });

  test('showSettingsDialog / showSettingsDrawer / showShareDialog', () => {
    expect(selectors.showSettingsDialog(makeState({ showSettingsDialog: true }))).toBe(true);
    expect(selectors.showSettingsDrawer(makeState({ showSettingsDrawer: true }))).toBe(true);
    expect(selectors.showShareDialog(makeState({ showShareDialog: true }))).toBe(true);
  });

  test('isForking / isSaving', () => {
    expect(selectors.isForking(makeState({ forking: true }))).toBe(true);
    expect(selectors.isSaving(makeState({ saving: true }))).toBe(true);
  });

  test('getParser returns parser by ID', () => {
    const p = selectors.getParser(makeState());
    expect(p.id).toBe('acorn');
  });

  test('getParserSettings', () => {
    const s = makeState();
    s.workbench.parserSettings = { jsx: true };
    expect(selectors.getParserSettings(s)).toEqual({ jsx: true });
  });

  test('getParseResult', () => {
    const pr = { ast: {} };
    const s = makeState();
    s.workbench.parseResult = pr;
    expect(selectors.getParseResult(s)).toBe(pr);
  });

  test('getRevision', () => {
    const rev = { getSnippetID: () => '123' };
    expect(selectors.getRevision(makeState({ activeRevision: rev }))).toBe(rev);
    expect(selectors.getRevision(makeState())).toBeNull();
  });

  test('getCode / getInitialCode', () => {
    const s = makeState();
    s.workbench.code = 'new code';
    s.workbench.initialCode = 'old code';
    expect(selectors.getCode(s)).toBe('new code');
    expect(selectors.getInitialCode(s)).toBe('old code');
  });

  test('getKeyMap', () => {
    const s = makeState();
    s.workbench.keyMap = 'vim';
    expect(selectors.getKeyMap(s)).toBe('vim');
  });

  test('getTransformCode / getInitialTransformCode', () => {
    const s = makeState();
    s.workbench.transform.code = 'export default fn';
    s.workbench.transform.initialCode = 'orig';
    expect(selectors.getTransformCode(s)).toBe('export default fn');
    expect(selectors.getInitialTransformCode(s)).toBe('orig');
  });

  test('getTransformer', () => {
    const s = makeState();
    s.workbench.transform.transformer = 'babel';
    expect(selectors.getTransformer(s)).toEqual({ id: 'babel' });
  });

  test('getTransformResult', () => {
    const s = makeState();
    s.workbench.transform.transformResult = { code: 'out' };
    expect(selectors.getTransformResult(s)).toEqual({ code: 'out' });
  });

  test('showTransformer', () => {
    expect(selectors.showTransformer(makeState({ showTransformPanel: true }))).toBe(true);
    expect(selectors.showTransformer(makeState())).toBe(false);
  });

  // Computed selectors
  test('canFork is true when revision exists', () => {
    expect(selectors.canFork(makeState({ activeRevision: { canSave: () => true } }))).toBe(true);
    expect(selectors.canFork(makeState())).toBe(false);
  });

  test('canSaveTransform is true when transformer shown and code dirty', () => {
    const s = makeState({ showTransformPanel: true });
    s.workbench.transform.code = 'changed';
    s.workbench.transform.initialCode = 'original';
    expect(selectors.canSaveTransform(s)).toBe(true);
  });

  test('canSaveTransform is false when transformer hidden', () => {
    const s = makeState({ showTransformPanel: false });
    s.workbench.transform.code = 'changed';
    s.workbench.transform.initialCode = 'original';
    expect(selectors.canSaveTransform(s)).toBe(false);
  });

  test('canSave is true when no revision (new snippet)', () => {
    const s = makeState();
    expect(selectors.canSave(s)).toBe(true);
  });

  test('canSave is true when code is dirty and revision allows saving', () => {
    const s = makeState({
      activeRevision: {
        canSave: () => true,
        getParserID: () => 'acorn',
        getParserSettings: () => null,
      },
    });
    s.workbench.code = 'changed';
    s.workbench.initialCode = 'original';
    expect(selectors.canSave(s)).toBe(true);
  });

  test('canSave is false when nothing is dirty and revision exists', () => {
    const s = makeState({
      activeRevision: {
        canSave: () => true,
        getParserID: () => 'acorn',
        getParserSettings: () => null,
      },
    });
    // code is same as initial (not dirty)
    expect(selectors.canSave(s)).toBe(false);
  });
});
