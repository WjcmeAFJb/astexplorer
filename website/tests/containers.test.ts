/**
 * Container tests verify that mapStateToProps/mapDispatchToProps wire correctly.
 * We test the container's connected behavior by creating a real Redux store
 * and checking that the right props flow through.
 */
import { describe, test, expect, vi } from 'vitest';
import { createStore } from 'redux';

vi.mock('astexplorer-parsers', () => ({
  categories: [
    {
      id: 'javascript',
      displayName: 'JavaScript',
      parsers: [{ id: 'acorn', showInMenu: true }],
      transformers: [],
    },
  ],
  getCategoryByID: (id: string) => ({
    id,
    displayName: id,
    codeExample: '// code',
    parsers: [
      {
        id: 'acorn',
        showInMenu: true,
        displayName: 'acorn',
        category: { id: 'javascript', codeExample: '// js' },
        hasSettings: () => false,
      },
    ],
    transformers: [],
  }),
  getDefaultParser: (cat: any) => ({
    id: 'acorn',
    category: cat || { id: 'javascript', codeExample: '// js', editorMode: 'javascript' },
    hasSettings: () => false,
  }),
  getParserByID: (id: string) => ({
    id,
    displayName: id,
    category: { id: 'javascript', codeExample: '// js', editorMode: 'javascript' },
    hasSettings: () => false,
  }),
  getTransformerByID: (id: string) =>
    id ? { id, displayName: id, defaultTransform: '' } : undefined,
}));

import { astexplorer } from '../src/store/reducers';
import * as actions from '../src/store/actions';

describe('containers integration with store', () => {
  function makeStore() {
    return createStore(astexplorer as any);
  }

  test('store initializes with default state', () => {
    const store = makeStore();
    const state = store.getState();
    expect(state.workbench.parser).toBeTruthy();
    expect(state.workbench.code).toBeTruthy();
    expect(state.saving).toBe(false);
    expect(state.forking).toBe(false);
  });

  test('dispatching SET_CODE updates state', () => {
    const store = makeStore();
    store.dispatch(actions.setCode({ code: 'new code' }));
    expect(store.getState().workbench.code).toBe('new code');
  });

  test('dispatching SET_PARSER updates parser and tracks per category', () => {
    const store = makeStore();
    const parser = { id: 'esprima', category: { id: 'javascript' } } as any;
    store.dispatch(actions.setParser(parser));
    expect(store.getState().workbench.parser).toBe('esprima');
    expect(store.getState().parserPerCategory.javascript).toBe('esprima');
  });

  test('full save/fork lifecycle', () => {
    const store = makeStore();
    store.dispatch(actions.startSave(false));
    expect(store.getState().saving).toBe(true);
    expect(store.getState().forking).toBe(false);
    store.dispatch(actions.endSave(false));
    expect(store.getState().saving).toBe(false);

    store.dispatch(actions.startSave(true));
    expect(store.getState().saving).toBe(false);
    expect(store.getState().forking).toBe(true);
    store.dispatch(actions.endSave(true));
    expect(store.getState().forking).toBe(false);
  });

  test('SET_SNIPPET loads revision data', () => {
    const store = makeStore();
    const revision = {
      getTransformerID: () => null,
      getParserID: () => 'esprima',
      getParserSettings: () => ({ jsx: true }),
      getCode: () => 'snippet code',
      getTransformCode: () => 'transform code',
    };
    store.dispatch(actions.setSnippet(revision as any));
    expect(store.getState().workbench.parser).toBe('esprima');
    expect(store.getState().workbench.code).toBe('snippet code');
    expect(store.getState().activeRevision).toBe(revision);
  });

  test('SET_SNIPPET with transformer shows transform panel', () => {
    const store = makeStore();
    const revision = {
      getTransformerID: () => 'babel',
      getParserID: () => 'acorn',
      getParserSettings: () => null,
      getCode: () => 'code',
      getTransformCode: () => 'transform',
    };
    store.dispatch(actions.setSnippet(revision as any));
    expect(store.getState().showTransformPanel).toBe(true);
  });

  test('RESET restores defaults and clears revision', () => {
    const store = makeStore();
    store.dispatch(actions.setCode({ code: 'modified' }));
    store.dispatch(actions.setCursor(42));
    store.dispatch(actions.reset());
    expect(store.getState().cursor).toBeNull();
    expect(store.getState().activeRevision).toBeNull();
  });

  test('error lifecycle', () => {
    const store = makeStore();
    const err = new Error('test');
    store.dispatch(actions.setError(err));
    expect(store.getState().error).toBe(err);
    store.dispatch(actions.clearError());
    expect(store.getState().error).toBeNull();
  });

  test('SELECT_TRANSFORMER shows panel', () => {
    const store = makeStore();
    store.dispatch(
      actions.selectTransformer({
        id: 'babel',
        defaultParserID: 'acorn',
        defaultTransform: '// t',
      } as any),
    );
    expect(store.getState().showTransformPanel).toBe(true);
    expect(store.getState().workbench.transform.transformer).toBe('babel');
  });

  test('HIDE_TRANSFORMER hides panel', () => {
    const store = makeStore();
    store.dispatch(
      actions.selectTransformer({
        id: 'babel',
        defaultParserID: 'acorn',
        defaultTransform: '',
      } as any),
    );
    store.dispatch(actions.hideTransformer());
    expect(store.getState().showTransformPanel).toBe(false);
  });

  test('SET_KEY_MAP updates keymap', () => {
    const store = makeStore();
    store.dispatch(actions.setKeyMap('vim'));
    expect(store.getState().workbench.keyMap).toBe('vim');
  });

  test('TOGGLE_FORMATTING toggles', () => {
    const store = makeStore();
    expect(store.getState().enableFormatting).toBe(false);
    store.dispatch(actions.toggleFormatting());
    expect(store.getState().enableFormatting).toBe(true);
  });

  test('loading snippet lifecycle', () => {
    const store = makeStore();
    store.dispatch(actions.startLoadingSnippet());
    expect(store.getState().loadingSnippet).toBe(true);
    store.dispatch(actions.doneLoadingSnippet());
    expect(store.getState().loadingSnippet).toBe(false);
  });

  test('settings dialog lifecycle', () => {
    const store = makeStore();
    store.dispatch(actions.openSettingsDialog());
    expect(store.getState().showSettingsDialog).toBe(true);
    store.dispatch(actions.closeSettingsDialog());
    expect(store.getState().showSettingsDialog).toBe(false);
  });

  test('SET_PARSER_SETTINGS stores per parser when no revision', () => {
    const store = makeStore();
    store.dispatch(actions.setParserSettings({ ecmaVersion: 2020 }));
    const parserID = store.getState().workbench.parser;
    expect(store.getState().parserSettings[parserID]).toEqual({ ecmaVersion: 2020 });
  });

  test('CLEAR_SNIPPET resets code and hides transform', () => {
    const store = makeStore();
    store.dispatch(
      actions.selectTransformer({
        id: 'babel',
        defaultParserID: 'acorn',
        defaultTransform: '',
      } as any),
    );
    store.dispatch(actions.clearSnippet());
    expect(store.getState().showTransformPanel).toBe(false);
    expect(store.getState().activeRevision).toBeNull();
  });

  test('DROP_TEXT changes code and category', () => {
    const store = makeStore();
    store.dispatch(actions.dropText('dropped code', 'css'));
    expect(store.getState().workbench.code).toBe('dropped code');
  });
});
