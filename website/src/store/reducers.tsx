import * as actions from './actions';
import {getCategoryByID, getDefaultParser, getParserByID, getTransformerByID} from 'astexplorer-parsers';
import type {Revision, Category, Transformer, TransformResult, Action, WorkbenchState, AppState} from '../types';

const defaultParser = getDefaultParser(getCategoryByID('javascript'));

const initialState: AppState = {

  // UI related state
  showSettingsDialog: false,
  showSettingsDrawer: false,
  showShareDialog: false,
  loadingSnippet: false,
  forking: false,
  saving: false,
  cursor: null,
  error: null,
  showTransformPanel: false,

  // Snippet related state
  selectedRevision: null,

  // Workbench settings

  // Contains local settings of all parsers
  parserSettings: {},

  // Remember selected parser per category
  parserPerCategory: {},

  workbench: {
    parser: defaultParser.id,
    parserSettings: null,
    parseError: null,
    code: defaultParser.category.codeExample,
    keyMap: 'default',
    initialCode: defaultParser.category.codeExample,
    transform: {
      code: '',
      initialCode: '',
      transformer: null,
      transformResult: null,
    },
  },

  enableFormatting: false,

};

/**

 * Returns the subset of the data that makes sense to persist between visits.
 */
export function persist(state: AppState): {showTransformPanel?: boolean, parserSettings?: Record<string, Record<string, unknown>>, parserPerCategory?: Record<string, string>, workbench: {parser?: string, code?: string, keyMap?: string, transform: {code?: string, transformer?: string | null}}} {
  return {
    ...pick(state, 'showTransformPanel', 'parserSettings', 'parserPerCategory'),
    workbench: {
      ...pick(state.workbench, 'parser', 'code', 'keyMap'),
      transform: pick(state.workbench.transform, 'code', 'transformer'),
    },
  };
}

/**

 * When read from persistent storage, set the last stored code as initial version.
 * This is necessary because we use CodeMirror as an uncontrolled component.
 */
export function revive(state: AppState =initialState): AppState {
  return {
    ...state,
    workbench: {
      ...state.workbench,
      initialCode: state.workbench.code,
      parserSettings: state.parserSettings[state.workbench.parser] ?? null,
      transform: {
        ...state.workbench.transform,
        initialCode: state.workbench.transform.code,
      },
    },
  };
}

export function astexplorer(state: AppState =initialState, action: Action): AppState {
  return {
    // UI related state
    showSettingsDialog: showSettingsDialog(state.showSettingsDialog, action),
    showSettingsDrawer: showSettingsDrawer(state.showSettingsDrawer, action),
    showShareDialog: showShareDialog(state.showShareDialog, action),
    loadingSnippet: loadSnippet(state.loadingSnippet, action),
    saving: saving(state.saving, action),
    forking: forking(state.forking, action),
    cursor: cursor(state.cursor, action),
    error: error(state.error, action),
    showTransformPanel: showTransformPanel(state.showTransformPanel, action),

    // Snippet related state
    activeRevision: activeRevision(state.activeRevision, action),

    // Workbench settings
    parserPerCategory: parserPerCategory(state.parserPerCategory, action),
    parserSettings: parserSettings(state.parserSettings, action, state),
    workbench: workbench(state.workbench, action, state),
    enableFormatting: format(state.enableFormatting, action),
  };
}

function format(state: boolean =initialState.enableFormatting, action: Action): boolean {
  if (action.type === actions.TOGGLE_FORMATTING) return !state;
  return state;
}

function getDefaultTransform(transformer: Transformer, workbenchState: WorkbenchState): string {
  if (typeof transformer.formatCodeExample === 'function') {
    return transformer.formatCodeExample(
      transformer.defaultTransform,
      {
        parser: workbenchState.parser,
        parserSettings: workbenchState.parserSettings ?? {},
      },
    )
  }
  return transformer.defaultTransform
}

function workbench(state: WorkbenchState =initialState.workbench, action: Action, fullState: AppState): WorkbenchState {
    function parserFromCategory(category: Category): Partial<WorkbenchState> {
    const parser = fullState.parserPerCategory[category.id] !== undefined && fullState.parserPerCategory[category.id] !== ''
      ? fullState.parserPerCategory[category.id]
      : getDefaultParser(category).id;
    return {
      parser,
      parserSettings: fullState.parserSettings[parser] ?? null,
      code: category.codeExample,
      initialCode: category.codeExample,
    };
  }

  switch (action.type) {
    case actions.SELECT_CATEGORY:
      if (!action.category) return state;
      return {
        ...state,
        ...parserFromCategory(action.category),
      };
    case actions.DROP_TEXT:
      {
        const categoryId = action.categoryId ?? '';
        const text = action.text ?? '';
        return {
          ...state,
          ...parserFromCategory(getCategoryByID(categoryId)),
          code: text,
          initialCode: text,
        };
      }
    case actions.SET_PARSE_RESULT:
      return {...state, parseResult: action.result};
    case actions.SET_PARSER_SETTINGS:
      return {...state, parserSettings: action.settings ?? null};
    case actions.SET_PARSER:
      {
        if (!action.parser) return state;
        const newState = {
          ...state,
          parser: action.parser.id,
          parserSettings: fullState.parserSettings[action.parser.id] ?? null,
        };

        // Check if we might want to reformat the code example
        if (state.transform.transformer !== null) {
          const transformer = getTransformerByID(state.transform.transformer)
          if (transformer !== undefined && state.transform.code === getDefaultTransform(transformer, state)) {
            newState.transform = {
              ...state.transform,
              code: getDefaultTransform(transformer, newState),
            }
          }
        }
        return newState;
      }
    case actions.SET_CODE:
      return {...state, code: action.code ?? ''};
    case actions.SELECT_TRANSFORMER:
      {
        if (!action.transformer) return state;
        const transformer = action.transformer;
        const parserIsCompatible =
          transformer.compatibleParserIDs !== undefined && transformer.compatibleParserIDs !== null && transformer.compatibleParserIDs.has(state.parser)
        const differentParser =
          transformer.defaultParserID !== state.parser && !parserIsCompatible;
        const differentTransformer =
          transformer.id !== state.transform.transformer ;

        if (!(differentParser || differentTransformer)) {
          return state;
        }

        const newState = {...state};

        if (differentParser) {
          newState.parser = transformer.defaultParserID;
          newState.parserSettings =
            fullState.parserSettings[transformer.defaultParserID] ?? null;
        }

        if (differentTransformer) {
          const snippetHasDifferentTransform = fullState.activeRevision !== null && fullState.activeRevision !== undefined &&
            fullState.activeRevision.getTransformerID() === transformer.id;
          newState.transform = {
            ...state.transform,
            transformer: transformer.id,
            transformResult: null,
            code: snippetHasDifferentTransform ?
              state.transform.code :
              getDefaultTransform(transformer, state),
            initialCode: snippetHasDifferentTransform ?
              fullState.activeRevision!.getTransformCode() :
              getDefaultTransform(transformer, state),
          };
        }

        return newState;
      }
    case actions.SET_TRANSFORM:
      return {
        ...state,
        transform: {
          ...state.transform,
          code: action.code ?? '',
        },
      };
    case actions.SET_TRANSFORM_RESULT:
      return {
        ...state,
        transform: {
          ...state.transform,
          transformResult: ((action.result ?? null) as unknown) as TransformResult | null,
        },
      };
    case actions.SET_SNIPPET:
      {
        if (!action.revision) return state;
        const revision = action.revision;

        const transformerID = revision.getTransformerID() ?? null;
        const parserID = revision.getParserID();

        return {
          ...state,
          parser: parserID,
          parserSettings: ((): Record<string, unknown> | null => { const ps = revision.getParserSettings(); return (ps !== null && ps !== false) ? ps : (fullState.parserSettings[parserID] ?? null); })(),
          code: revision.getCode(),
          initialCode: revision.getCode(),
          transform: {
            ...state.transform,
            transformer: transformerID,
            code: revision.getTransformCode(),
            initialCode: revision.getTransformCode(),
          },
        };
      }
    case actions.CLEAR_SNIPPET:
    case actions.RESET:
      {
        const reset = Boolean(actions.RESET);
        const newState = {
          ...state,
          parserSettings: fullState.parserSettings[state.parser] ?? null,
          code: getParserByID(state.parser).category.codeExample,
          initialCode: getParserByID(state.parser).category.codeExample,
        };
        const activeTransformerID = fullState.activeRevision !== undefined && fullState.activeRevision !== null
          ? fullState.activeRevision.getTransformerID()
          : undefined;
        if ((activeTransformerID !== undefined && activeTransformerID !== null && activeTransformerID !== '') || (reset && state.transform.transformer !== null && state.transform.transformer !== '')) {
          // Clear transform as well
          const transformer = getTransformerByID(state.transform.transformer!);
          newState.transform = {
            ...state.transform,
            code: getDefaultTransform(transformer, state),
            initialCode: getDefaultTransform(transformer, state),
          };
        }
        return newState;
      }
    case actions.SET_KEY_MAP:
      return {...state, keyMap: action.keyMap ?? 'default'};
    default:
      return state;
  }
}

function parserSettings(state: Record<string, Record<string, unknown>> =initialState.parserSettings, action: Action, fullState: AppState): Record<string, Record<string, unknown>> {
  switch (action.type) {
    case actions.SET_PARSER_SETTINGS:
      if (fullState.activeRevision) {
        // If a revision is loaded, we are **not** storing changes to the
        // settings in our local copy
        return state;
      }
      if (!action.settings) return state;
      return {
        ...state,
        [fullState.workbench.parser]: action.settings,
      };
    default:
      return state;
  }
}

function parserPerCategory(state: Record<string, string> =initialState.parserPerCategory, action: Action): Record<string, string> {
  switch (action.type) {
    case actions.SET_PARSER:
      if (!action.parser) return state;
      return {...state, [action.parser.category.id]: action.parser.id};
    default:
      return state;
  }
}

function showSettingsDialog(state: boolean =initialState.showSettingsDialog, action: Action): boolean {
  switch(action.type) {
    case actions.OPEN_SETTINGS_DIALOG:
      return true;
    case actions.CLOSE_SETTINGS_DIALOG:
      return false;
    default:
      return state;
  }
}

function showSettingsDrawer(state: boolean =initialState.showSettingsDrawer, action: Action): boolean {
  switch(action.type) {
    case actions.EXPAND_SETTINGS_DRAWER:
      return true;
    case actions.COLLAPSE_SETTINGS_DRAWER:
      return false;
    default:
      return state;
  }
}

function showShareDialog(state: boolean =initialState.showShareDialog, action: Action): boolean {
  switch(action.type) {
    case actions.OPEN_SHARE_DIALOG:
      return true;
    case actions.CLOSE_SHARE_DIALOG:
      return false;
    default:
      return state;
  }
}

function loadSnippet(state: boolean =initialState.loadingSnippet, action: Action): boolean {
  switch(action.type) {
    case actions.START_LOADING_SNIPPET:
      return true;
    case actions.DONE_LOADING_SNIPPET:
      return false;
    default:
      return state;
  }
}

function saving(state: boolean =initialState.saving, action: Action): boolean {
  switch(action.type) {
    case actions.START_SAVE:
      return action.fork !== true;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function forking(state: boolean =initialState.forking, action: Action): boolean {
  switch(action.type) {
    case actions.START_SAVE:
      return action.fork === true;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function cursor(state: number | null =initialState.cursor, action: Action): number | null {
  switch(action.type) {
    case actions.SET_CURSOR:
      return action.cursor ?? null;
    case actions.SET_CODE:
      // If this action is triggered and the cursor = 0, then the code must be
      // loaded
      if (action.cursor !== null && action.cursor !== undefined && action.cursor !== 0) {
        return action.cursor;
      }
      return state;
    case actions.RESET:
    case actions.SET_SNIPPET:
    case actions.CLEAR_SNIPPET:
      return null;
    default:
      return state;
  }
}

function error(state: Error | null =initialState.error, action: Action): Error | null {
  switch (action.type) {
    case actions.SET_ERROR:
      return action.error ?? null;
    case actions.CLEAR_ERROR:
      return null;
    default:
      return state;
  }
}

function showTransformPanel(state: boolean =initialState.showTransformPanel, action: Action): boolean {
  switch (action.type) {
    case actions.SELECT_TRANSFORMER:
      return true;
    case actions.HIDE_TRANSFORMER:
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
      return false;
    case actions.SET_SNIPPET:
      return Boolean(action.revision?.getTransformerID());
    default:
      return state;
  }
}

function activeRevision(state: Revision | null =initialState.selectedRevision ?? null, action: Action): Revision | null {
  switch (action.type) {
    case actions.SET_SNIPPET:
      return action.revision ?? null;
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
    case actions.RESET:
      return null;
    default:
      return state;
  }
}

function pick<T extends Record<string, unknown>>(obj: T, ...properties: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {};
  for (const prop of properties) {
    (result)[prop] = obj[prop];
  }
  return result;
}
