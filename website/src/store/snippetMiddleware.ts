import * as selectors from './selectors';
import * as actions from './actions';
import type {AppState, Action, SnippetData} from '../types';
import type {Dispatch, MiddlewareAPI} from 'redux';
import type StorageAdapter from '../storage/index';

let clearURLOnClearError = false;
let cancelLoad: () => void = () => {}

export default (storageAdapter: StorageAdapter) => (store: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (action: Action) => {
  // oxlint-disable-next-line typescript-eslint(switch-exhaustiveness-check) -- middleware intentionally handles only relevant action types
  switch (action.type) {
    case actions.CLEAR_ERROR:
      // If CLEAR_ERROR action happens after a URL was loaded, clear the URL
      if (clearURLOnClearError) {
        clearURLOnClearError = false;
        window.location.hash = '';
      }
      return next(action);
    case actions.LOAD_SNIPPET:
      return loadSnippet(store.getState(), next, storageAdapter);
    case actions.SAVE:
      next(actions.startSave(action.fork === true));
      void saveSnippet(action, store.getState(), next, storageAdapter)
        // oxlint-disable-next-line promise/no-callback-in-promise -- redux middleware must call next() after save completes
        .then(() => next(actions.endSave(action.fork === true)));
      break;
    default:
      // Pass on
      return next(action);
  }
}

async function loadSnippet(state: AppState, next: Dispatch, storageAdapter: StorageAdapter): Promise<void> {
  // Ignore changes to the URL while a snippet is being saved (that process will
  // update the URL.
  if (selectors.isSaving(state) || selectors.isForking(state)) {
    return;
  }

  // Cancel any previous snippet loader (see below)
  cancelLoad();
  // Do not clear URL anymore, we are loading a new one
  clearURLOnClearError = false;

  next(actions.setError(null));
  next(actions.startLoadingSnippet());

  try {
    let cancelled = false;
    cancelLoad = () => cancelled = true;
    const revision = await storageAdapter.fetchFromURL();
    // revision can be null if the URL is "empty"
    if (!cancelled) {
      if (revision) {
        next(actions.setSnippet(revision));
      } else {
        next(actions.clearSnippet());
      }
    }
  } catch(err) {
    const errorMessage = 'Failed to fetch revision: ' + (err instanceof Error ? err.message : String(err));

    clearURLOnClearError = true;
    next(actions.setError(new Error(errorMessage)));
  } finally {
    next(actions.doneLoadingSnippet());
  }
}

async function saveSnippet({fork}: Action, state: AppState, next: Dispatch, storageAdapter: StorageAdapter): Promise<void> {
  const revision = selectors.getRevision(state);
  const parser = selectors.getParser(state);
  const parserSettings = selectors.getParserSettings(state);
  const code = selectors.getCode(state);
  const transformCode = selectors.getTransformCode(state);
  const transformer = selectors.getTransformer(state);
  const showTransformPanel = selectors.showTransformer(state);

    const data: SnippetData = {
    parserID: parser.id,
    settings: {
      [parser.id]: parserSettings,
    },
    versions: {
      [parser.id]: parser.version,
    },
    filename: `source.${parser.category.fileExtension}`,
    code,
  };
  if (showTransformPanel && transformer) {
    data.toolID = transformer.id;
    data.versions[transformer.id] = transformer.version;
    data.transform = transformCode;
  }

  try {
    let newRevision;
    if (fork === true) {
      newRevision = await storageAdapter.fork(revision, data);
    } else if (revision !== null && revision !== undefined) {
      newRevision = await storageAdapter.update(revision, data);
    } else {
      newRevision = await storageAdapter.create(data);
    }
    if (newRevision !== undefined && newRevision !== null) {
      storageAdapter.updateHash(newRevision);
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    next(actions.setError(error));
  }
}
