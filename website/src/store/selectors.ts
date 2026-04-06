import isEqual from 'lodash.isequal';
import {getParserByID, getTransformerByID} from 'astexplorer-parsers';
import type {TransformResult, ParseResult, Revision, Transformer, Parser, AppState} from '../types';

// Our selectors are not computationally expensive so we can just use this
// implementation. Overloads preserve type safety at call sites.
function createSelector<A, R>(deps: [(s: AppState) => A], f: (a: A) => R): (s: AppState) => R;
function createSelector<A, B, R>(deps: [(s: AppState) => A, (s: AppState) => B], f: (a: A, b: B) => R): (s: AppState) => R;
function createSelector<A, B, C, R>(deps: [(s: AppState) => A, (s: AppState) => B, (s: AppState) => C], f: (a: A, b: B, c: C) => R): (s: AppState) => R;
function createSelector<A, B, C, D, R>(deps: [(s: AppState) => A, (s: AppState) => B, (s: AppState) => C, (s: AppState) => D], f: (a: A, b: B, c: C, d: D) => R): (s: AppState) => R;
function createSelector(deps: Array<(s: AppState) => unknown>, f: (...args: unknown[]) => unknown): (s: AppState) => unknown {
  return function(state) {
    const args = deps.map(d => d(state));
    return f(...args);
  }
}

// UI related

export function getFormattingState(state: AppState): boolean {
  return state.enableFormatting;
}

export function getCursor(state: AppState): number | null {
  return state.cursor;
}

export function getError(state: AppState): Error | null {
  return state.error;
}

export function isLoadingSnippet(state: AppState): boolean {
  return state.loadingSnippet;
}

export function showSettingsDialog(state: AppState): boolean {
  return state.showSettingsDialog;
}

export function showSettingsDrawer(state: AppState): boolean {
  return state.showSettingsDrawer;
}

export function showShareDialog(state: AppState): boolean {
  return state.showShareDialog;
}

export function isForking(state: AppState): boolean {
  return state.forking;
}

export function isSaving(state: AppState): boolean {
  return state.saving;
}

// Parser related

export function getParser(state: AppState): Parser {
  return getParserByID(state.workbench.parser);
}

export function getParserSettings(state: AppState): Record<string, unknown> | null {
  return state.workbench.parserSettings;
}

export function getParseResult(state: AppState): ParseResult | undefined {
  return state.workbench.parseResult;
}

// Code related
export function getRevision(state: AppState): Revision | null | undefined {
  return state.activeRevision;
}

export function getCode(state: AppState): string {
  return state.workbench.code;
}

export function getInitialCode(state: AppState): string {
  return state.workbench.initialCode;
}

export function getKeyMap (state: AppState): string {
  return state.workbench.keyMap;
}

const isCodeDirty: (state: AppState) => boolean = createSelector(
  [getCode, getInitialCode],
  (code: string, initialCode: string) => code !== initialCode,
);

// Transform related

export function getTransformCode(state: AppState): string {
  return state.workbench.transform.code;
}

export function getInitialTransformCode(state: AppState): string {
  return state.workbench.transform.initialCode;
}

export function getTransformer(state: AppState): Transformer | undefined {
  const transformer = state.workbench.transform.transformer;
  if (transformer === null) {
    return undefined;
  }
  return getTransformerByID(transformer);
}

export function getTransformResult(state: AppState): TransformResult | null {
  return state.workbench.transform.transformResult;
}

export function showTransformer(state: AppState): boolean {
  return state.showTransformPanel;
}

const isTransformDirty: (state: AppState) => boolean = createSelector(
  [getTransformCode, getInitialTransformCode],
  (code: string, initialCode: string) => code !== initialCode,
);

export const canFork: (state: AppState) => boolean = createSelector(
  [getRevision],
  (revision: unknown) => revision !== null && revision !== undefined,
);

const canSaveCode: (state: AppState) => boolean = createSelector(
  [getRevision, isCodeDirty],
  // can always save if there is no revision
  (revision: unknown, dirty: unknown) => (
    (revision === null || revision === undefined) ||
    (dirty === true)
  ),
);

export const canSaveTransform: (state: AppState) => boolean = createSelector(
  [showTransformer, isTransformDirty],
  (isShowTransformer: boolean, dirty: boolean) => isShowTransformer && dirty,
);

function isRevision(value: unknown): value is Revision {
  return value !== null && value !== undefined && typeof value === 'object' && 'getParserSettings' in value;
}

function isParser(value: unknown): value is Parser {
  return value !== null && value !== undefined && typeof value === 'object' && 'id' in value;
}

const didParserSettingsChange: (state: AppState) => boolean = createSelector(
  [getParserSettings, getRevision, getParser],
  (parserSettings: unknown, revisionArg: unknown, parserArg: unknown) => {
    if (!isRevision(revisionArg) || !isParser(parserArg)) {
      return false;
    }
    const savedParserSettings = revisionArg.getParserSettings();
    return (
      parserArg.id !== revisionArg.getParserID() ||
      (savedParserSettings !== null && !isEqual(parserSettings, savedParserSettings))
    );
  },
);

export const canSave: (state: AppState) => boolean = createSelector(
  [getRevision, canSaveCode, canSaveTransform, didParserSettingsChange],
  (revArg: unknown, codeDirty: unknown, transformDirty: unknown, settingsChanged: unknown) => {
    return (
      (codeDirty === true || transformDirty === true || settingsChanged === true) &&
      (!isRevision(revArg) || revArg.canSave())
    );
  },
);
