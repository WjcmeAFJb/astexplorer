// Tests specifically for mutation testing — no vi.mock() to avoid
// module caching interference with Stryker's instrumentation.
import { describe, test, expect } from 'vitest';
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
      parserSettings: { jsx: true },
      parseResult: { ast: {}, error: null },
      code: 'const x = 1;',
      initialCode: 'const x = 1;',
      keyMap: 'default',
      transform: {
        transformer: 'babel',
        code: 'export default function(fileInfo) { return fileInfo.source; }',
        initialCode: '',
        transformResult: { code: 'transformed' },
      },
    },
    ...overrides,
  };
}

describe('selectors (mutation-tested)', () => {
  test('getFormattingState returns exact value', () => {
    expect(selectors.getFormattingState(makeState({ enableFormatting: true }))).toBe(true);
    expect(selectors.getFormattingState(makeState({ enableFormatting: false }))).toBe(false);
  });

  test('getCursor returns exact value', () => {
    expect(selectors.getCursor(makeState({ cursor: 42 }))).toBe(42);
    expect(selectors.getCursor(makeState())).toBeNull();
  });

  test('getError returns exact value', () => {
    const err = new Error('test');
    expect(selectors.getError(makeState({ error: err }))).toBe(err);
    expect(selectors.getError(makeState())).toBeNull();
  });

  test('isLoadingSnippet returns exact value', () => {
    expect(selectors.isLoadingSnippet(makeState({ loadingSnippet: true }))).toBe(true);
    expect(selectors.isLoadingSnippet(makeState())).toBe(false);
  });

  test('showSettingsDialog returns exact value', () => {
    expect(selectors.showSettingsDialog(makeState({ showSettingsDialog: true }))).toBe(true);
    expect(selectors.showSettingsDialog(makeState())).toBe(false);
  });

  test('showShareDialog returns exact value', () => {
    expect(selectors.showShareDialog(makeState({ showShareDialog: true }))).toBe(true);
    expect(selectors.showShareDialog(makeState())).toBe(false);
  });

  test('isSaving returns exact value', () => {
    expect(selectors.isSaving(makeState({ saving: true }))).toBe(true);
    expect(selectors.isSaving(makeState())).toBe(false);
  });

  test('isForking returns exact value', () => {
    expect(selectors.isForking(makeState({ forking: true }))).toBe(true);
    expect(selectors.isForking(makeState())).toBe(false);
  });

  test('showTransformer returns exact value', () => {
    expect(selectors.showTransformer(makeState({ showTransformPanel: true }))).toBe(true);
    expect(selectors.showTransformer(makeState())).toBe(false);
  });

  test('getParser returns parser id', () => {
    const parser = selectors.getParser(makeState());
    expect(parser).toBeTruthy();
  });

  test('getParserSettings returns settings', () => {
    expect(selectors.getParserSettings(makeState())).toEqual({ jsx: true });
  });

  test('getParseResult returns parse result', () => {
    const result = selectors.getParseResult(makeState());
    expect(result).toEqual({ ast: {}, error: null });
  });

  test('getCode returns code string', () => {
    expect(selectors.getCode(makeState())).toBe('const x = 1;');
  });

  test('getInitialCode returns initial code', () => {
    expect(selectors.getInitialCode(makeState())).toBe('const x = 1;');
  });

  test('getKeyMap returns keymap', () => {
    expect(selectors.getKeyMap(makeState())).toBe('default');
  });

  test('getTransformer returns transformer id', () => {
    const t = selectors.getTransformer(makeState());
    expect(t).toBeTruthy();
  });

  test('getTransformCode returns transform code', () => {
    expect(selectors.getTransformCode(makeState())).toBe(
      'export default function(fileInfo) { return fileInfo.source; }',
    );
  });

  test('getInitialTransformCode returns initial transform code', () => {
    expect(selectors.getInitialTransformCode(makeState())).toBe('');
  });

  test('getTransformResult returns transform result', () => {
    expect(selectors.getTransformResult(makeState())).toEqual({ code: 'transformed' });
  });

  test('getRevision returns activeRevision', () => {
    const rev = { id: 'rev1' };
    expect(selectors.getRevision(makeState({ activeRevision: rev }))).toBe(rev);
    expect(selectors.getRevision(makeState())).toBeNull();
  });

  test('canSave returns boolean', () => {
    expect(typeof selectors.canSave(makeState())).toBe('boolean');
  });

  test('canFork returns false by default', () => {
    expect(selectors.canFork(makeState())).toBe(false);
  });

  test('canSaveTransform returns false by default', () => {
    expect(selectors.canSaveTransform(makeState())).toBe(false);
  });

  test('showSettingsDrawer returns exact value', () => {
    expect(selectors.showSettingsDrawer(makeState({ showSettingsDrawer: true }))).toBe(true);
    expect(selectors.showSettingsDrawer(makeState())).toBe(false);
  });
});
