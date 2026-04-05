// @ts-expect-error — no declaration file
import isEqual from 'lodash.isequal';
import {getParserByID, getTransformerByID} from 'astexplorer-parsers';
import type {TransformResult, ParseResult, Revision, Transformer, Parser, AppState} from '../types';

// Our selectors are not computationally expensive so we can just use this
// implementation.
// createSelector uses Function.apply which loses type information.
function createSelector<R = unknown>(deps: Array<(state: AppState) => unknown>, f: (...args: unknown[]) => R): (state: AppState) => R {
  return function(state) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- Function.apply returns any; TS limitation
    return f.apply(this, deps.map(d => d(state)));
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
  return getTransformerByID(state.workbench.transform.transformer);
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
      // oxlint-disable-next-line typescript-eslint(no-unsafe-call), typescript-eslint(strict-boolean-expressions), typescript-eslint(no-unsafe-type-assertion) -- isEqual is from an untyped module (lodash.isequal)
      (savedParserSettings !== null && !(isEqual(parserSettings, savedParserSettings) as boolean))
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
