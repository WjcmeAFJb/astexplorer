import { describe, test, expect } from 'vitest';
import * as actions from '../src/store/actions';

describe('action creators', () => {
  test('setParser creates SET_PARSER action', () => {
    const parser = { id: 'acorn' } as any;
    expect(actions.setParser(parser)).toEqual({ type: 'SET_PARSER', parser });
  });

  test('setParserSettings creates SET_PARSER_SETTINGS action', () => {
    const settings = { jsx: true };
    expect(actions.setParserSettings(settings)).toEqual({
      type: 'SET_PARSER_SETTINGS',
      settings,
    });
  });

  test('selectCategory creates CHANGE_CATEGORY action', () => {
    const category = { id: 'css' } as any;
    expect(actions.selectCategory(category)).toEqual({
      type: 'CHANGE_CATEGORY',
      category,
    });
  });

  test('selectTransformer creates SELECT_TRANSFORMER action', () => {
    const transformer = { id: 'babel' } as any;
    expect(actions.selectTransformer(transformer)).toEqual({
      type: 'SELECT_TRANSFORMER',
      transformer,
    });
  });

  test('hideTransformer creates HIDE_TRANSFORMER action', () => {
    expect(actions.hideTransformer()).toEqual({ type: 'HIDE_TRANSFORMER' });
  });

  test('setCode creates SET_CODE action', () => {
    expect(actions.setCode({ code: 'x', cursor: 5 })).toEqual({
      type: 'SET_CODE',
      code: 'x',
      cursor: 5,
    });
  });

  test('setTransformState creates SET_TRANSFORM action', () => {
    expect(actions.setTransformState({ code: 'y' })).toEqual({
      type: 'SET_TRANSFORM',
      code: 'y',
    });
  });

  test('setCursor creates SET_CURSOR action', () => {
    expect(actions.setCursor(42)).toEqual({ type: 'SET_CURSOR', cursor: 42 });
  });

  test('dropText creates DROP_TEXT action', () => {
    expect(actions.dropText('some code', 'css')).toEqual({
      type: 'DROP_TEXT',
      text: 'some code',
      categoryId: 'css',
    });
  });

  test('setError creates SET_ERROR action', () => {
    const error = new Error('fail');
    expect(actions.setError(error)).toEqual({ type: 'SET_ERROR', error });
  });

  test('clearError creates CLEAR_ERROR', () => {
    expect(actions.clearError()).toEqual({ type: 'CLEAR_ERROR' });
  });

  test('startLoadingSnippet / doneLoadingSnippet', () => {
    expect(actions.startLoadingSnippet()).toEqual({ type: 'START_LOADING_SNIPPET' });
    expect(actions.doneLoadingSnippet()).toEqual({ type: 'DONE_LOADING_SNIPPET' });
  });

  test('setSnippet creates SET_SNIPPET action', () => {
    const revision = { id: 'abc' } as any;
    expect(actions.setSnippet(revision)).toEqual({
      type: 'SET_SNIPPET',
      revision,
    });
  });

  test('clearSnippet creates CLEAR_SNIPPET', () => {
    expect(actions.clearSnippet()).toEqual({ type: 'CLEAR_SNIPPET' });
  });

  test('loadSnippet creates LOAD_SNIPPET action', () => {
    expect(actions.loadSnippet()).toEqual({ type: 'LOAD_SNIPPET' });
  });

  test('openSettingsDialog / closeSettingsDialog', () => {
    expect(actions.openSettingsDialog()).toEqual({ type: 'OPEN_SETTINGS_DIALOG' });
    expect(actions.closeSettingsDialog()).toEqual({ type: 'CLOSE_SETTINGS_DIALOG' });
  });

  test('expandSettingsDrawer / collapseSettingsDrawer', () => {
    expect(actions.expandSettingsDrawer()).toEqual({ type: 'EXPAND_SETTINGS_DRAWER' });
    expect(actions.collapseSettingsDrawer()).toEqual({ type: 'COLLAPSE_SETTINGS_DRAWER' });
  });

  test('openShareDialog / closeShareDialog', () => {
    expect(actions.openShareDialog()).toEqual({ type: 'OPEN_SHARE_DIALOG' });
    expect(actions.closeShareDialog()).toEqual({ type: 'CLOSE_SHARE_DIALOG' });
  });

  test('startSave / endSave', () => {
    expect(actions.startSave(false)).toEqual({ type: 'START_SAVE', fork: false });
    expect(actions.startSave(true)).toEqual({ type: 'START_SAVE', fork: true });
    expect(actions.endSave(false)).toEqual({ type: 'END_SAVE', fork: false });
  });

  test('save creates SAVE action with fork flag', () => {
    expect(actions.save(true)).toEqual({ type: 'SAVE', fork: true });
    expect(actions.save(false)).toEqual({ type: 'SAVE', fork: false });
  });

  test('reset creates RESET', () => {
    expect(actions.reset()).toEqual({ type: 'RESET' });
  });

  test('toggleFormatting creates TOGGLE_FORMATTING', () => {
    expect(actions.toggleFormatting()).toEqual({ type: 'TOGGLE_FORMATTING' });
  });

  test('setKeyMap creates SET_KEY_MAP action', () => {
    expect(actions.setKeyMap('vim')).toEqual({ type: 'SET_KEY_MAP', keyMap: 'vim' });
  });

  test('all action type constants are unique strings', () => {
    const types = [
      actions.SET_ERROR, actions.CLEAR_ERROR, actions.LOAD_SNIPPET,
      actions.START_LOADING_SNIPPET, actions.DONE_LOADING_SNIPPET,
      actions.CLEAR_SNIPPET, actions.SELECT_CATEGORY, actions.SELECT_TRANSFORMER,
      actions.HIDE_TRANSFORMER, actions.SET_TRANSFORM, actions.SET_TRANSFORM_RESULT,
      actions.SET_PARSER, actions.SET_PARSER_SETTINGS, actions.SET_PARSE_RESULT,
      actions.SET_SNIPPET, actions.OPEN_SETTINGS_DIALOG, actions.CLOSE_SETTINGS_DIALOG,
      actions.EXPAND_SETTINGS_DRAWER, actions.COLLAPSE_SETTINGS_DRAWER,
      actions.OPEN_SHARE_DIALOG, actions.CLOSE_SHARE_DIALOG,
      actions.SET_CODE, actions.SET_CURSOR, actions.DROP_TEXT,
      actions.SAVE, actions.START_SAVE, actions.END_SAVE, actions.RESET,
      actions.TOGGLE_FORMATTING, actions.SET_KEY_MAP,
    ];
    for (const t of types) expect(typeof t).toBe('string');
    expect(new Set(types).size).toBe(types.length);
  });
});
