

// @ts-expect-error — no declaration file
import isEqual from 'lodash.isequal';
import {getParserByID, getTransformerByID} from '../parsers';
import type { TransformResult } from '../types';
import type { ParseResult } from '../types';
import type { Revision } from '../types';
import type { Transformer } from '../types';
import type { Parser } from '../types';
import type { AppState } from '../types';

// Our selectors are not computationally expensive so we can just use this
// implementation.
// createSelector uses Function.apply which loses type information.
// Callback parameters are untyped (any) because they come from heterogeneous
// dependency return types. Each call site uses @type to declare the actual signature.
function createSelector<R = any>(deps: Array<(state: AppState) => unknown>, f: (...args: any[]) => R): (state: AppState) => R {
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
  (revision: Revision | null | undefined) => !!revision,
);

const canSaveCode: (state: AppState) => boolean = createSelector(
  [getRevision, isCodeDirty],
  (revision: Revision | null | undefined, dirty: boolean) => (
    !revision || // can always save if there is no revision
    dirty
  ),
);

export const canSaveTransform: (state: AppState) => boolean = createSelector(
  [showTransformer, isTransformDirty],
  (showTransformer: boolean, dirty: boolean) => showTransformer && dirty,
);

const didParserSettingsChange: (state: AppState) => boolean = createSelector(
  [getParserSettings, getRevision, getParser],
  (parserSettings: Record<string, unknown> | null, revision: Revision | null | undefined, parser: Parser) => {
    const savedParserSettings = revision && revision.getParserSettings();
    return (
      !!revision &&
      (
        parser.id !== revision.getParserID() ||
        !!savedParserSettings && !isEqual(parserSettings, savedParserSettings)
      )
    )

  },
);

export const canSave: (state: AppState) => boolean = createSelector(
  [getRevision, canSaveCode, canSaveTransform, didParserSettingsChange],
  (revision: Revision | null | undefined, canSaveCode: boolean, canSaveTransform: boolean, didParserSettingsChange: boolean) => (
    (canSaveCode || canSaveTransform || didParserSettingsChange) &&
    (!revision || revision.canSave())
  ),
);
