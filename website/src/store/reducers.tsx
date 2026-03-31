

import * as actions from './actions';
import {getCategoryByID, getDefaultParser, getParserByID, getTransformerByID} from 'astexplorer-parsers';
type Revision = import('../types').Revision;
type Category = import('../types').Category;
type Transformer = import('../types').Transformer;
type Action = import('../types').Action;
type TransformState = import('../types').TransformState;
type WorkbenchState = import('../types').WorkbenchState;
type AppState = import('../types').AppState;

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
      parserSettings: state.parserSettings[state.workbench.parser] || null,
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
    // @ts-expect-error — third arg (fullState) passed for consistency with other sub-reducers; unused by format()
    enableFormatting: format(state.enableFormatting, action, state),
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
        parserSettings: workbenchState.parserSettings || {},
      },
    )
  }
  return transformer.defaultTransform
}

function workbench(state: WorkbenchState =initialState.workbench, action: Action, fullState: AppState): WorkbenchState {
    function parserFromCategory(category: Category): Partial<WorkbenchState> {
    const parser = fullState.parserPerCategory[category.id] ||
      getDefaultParser(category).id;
    return {
      parser,
      parserSettings: fullState.parserSettings[parser] || null,
      code: category.codeExample,
      initialCode: category.codeExample,
    };
  }

  switch (action.type) {
    case actions.SELECT_CATEGORY:
      return {
        ...state,
        ...parserFromCategory(action.category),
      };
    case actions.DROP_TEXT:
      return {
        ...state,
        ...parserFromCategory(getCategoryByID(action.categoryId)),
        code: action.text,
        initialCode: action.text,
      };
    case actions.SET_PARSE_RESULT:
      return {...state, parseResult: action.result};
    case actions.SET_PARSER_SETTINGS:
      return {...state, parserSettings: action.settings};
    case actions.SET_PARSER:
      {
        const newState = {...state, parser: action.parser.id};
        // @ts-expect-error — intentional cross-type comparison: action.parser is Parser, state.parser is string (ID). Always truthy, used as "parser changed" guard.
        if (action.parser !== state.parser) {
          // Update parser settings
          newState.parserSettings =
            fullState.parserSettings[action.parser.id] || null;

          // Check if we might want to reformat the code example
          const transformer = getTransformerByID(state.transform.transformer)
          if (transformer && state.transform.code === getDefaultTransform(transformer, state)) {
            newState.transform = {
              ...state.transform,
              code: getDefaultTransform(transformer, newState),
            }
          }
        }
        return newState;
      }
    case actions.SET_CODE:
      return {...state, code: action.code};
    case actions.SELECT_TRANSFORMER:
      {
        const parserIsCompatible =
          action.transformer.compatibleParserIDs && action.transformer.compatibleParserIDs.has(state.parser)
        const differentParser =
          action.transformer.defaultParserID !== state.parser && !parserIsCompatible;
        const differentTransformer =
          action.transformer.id !== state.transform.transformer ;

        if (!(differentParser || differentTransformer)) {
          return state;
        }

        const newState = {...state};

        if (differentParser) {
          newState.parser = action.transformer.defaultParserID;
          newState.parserSettings =
            fullState.parserSettings[action.transformer.defaultParserID] || null;
        }

        if (differentTransformer) {
          const snippetHasDifferentTransform = fullState.activeRevision &&
            fullState.activeRevision.getTransformerID() === action.transformer.id;
          newState.transform = {
            ...state.transform,
            transformer: action.transformer.id,
            transformResult: null,
            code: snippetHasDifferentTransform ?
              state.transform.code :
              getDefaultTransform(action.transformer, state),
            initialCode: snippetHasDifferentTransform ?
              fullState.activeRevision.getTransformCode() :
              getDefaultTransform(action.transformer, state),
          };
        }

        return newState;
      }
    case actions.SET_TRANSFORM:
      return {
        ...state,
        transform: {
          ...state.transform,
          code: action.code,
        },
      };
    case actions.SET_TRANSFORM_RESULT:
      return {
        ...state,
        transform: {
          ...state.transform,
          transformResult: action.result,
        },
      };
    case actions.SET_SNIPPET:
      {
        const {revision} = action;

        const transformerID = revision.getTransformerID();
        const parserID = revision.getParserID();

        return {
          ...state,
          parser: parserID,
          parserSettings: revision.getParserSettings() || fullState.parserSettings[parserID] || null,
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
          parserSettings: fullState.parserSettings[state.parser] || null,
          code: getParserByID(state.parser).category.codeExample,
          initialCode: getParserByID(state.parser).category.codeExample,
        };
        if (fullState.activeRevision && fullState.activeRevision.getTransformerID() || reset && state.transform.transformer) {
          // Clear transform as well
          const transformer = getTransformerByID(state.transform.transformer);
          newState.transform = {
            ...state.transform,
            code: getDefaultTransform(transformer, state),
            initialCode: getDefaultTransform(transformer, state),
          };
        }
        return newState;
      }
    case actions.SET_KEY_MAP:
      return {...state, keyMap: action.keyMap};
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
      return !action.fork;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function forking(state: boolean =initialState.forking, action: Action): boolean {
  switch(action.type) {
    case actions.START_SAVE:
      return action.fork;
    case actions.END_SAVE:
      return false;
    default:
      return state;
  }
}

function cursor(state: number | null =initialState.cursor, action: Action): number | null {
  switch(action.type) {
    case actions.SET_CURSOR:
      return action.cursor;
    case actions.SET_CODE:
      // If this action is triggered and the cursor = 0, then the code must be
      // loaded
      if (action.cursor != null && action.cursor !== 0) {
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
      return action.error;
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
      return Boolean(action.revision.getTransformerID());
    default:
      return state;
  }
}

function activeRevision(state: Revision | null =initialState.selectedRevision, action: Action): Revision | null {
  switch (action.type) {
    case actions.SET_SNIPPET:
      return action.revision;
    case actions.SELECT_CATEGORY:
    case actions.CLEAR_SNIPPET:
    case actions.RESET:
      return null;
    default:
      return state;
  }
}

function pick<T extends Record<string, unknown>>(obj: T, ...properties: string[]): Partial<T> {
  return (properties.reduce(
    (result: Record<string, unknown>, prop: string) => (result[prop] = obj[prop], result),
    ({} as Record<string, unknown>),
  ) as Partial<T>);
}
