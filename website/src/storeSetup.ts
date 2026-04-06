import {initWasm} from './wasmSetup';
import {astexplorer, persist, revive} from './store/reducers';
import {legacy_createStore as createStore, applyMiddleware, compose} from 'redux';
import {canSaveTransform, getRevision} from './store/selectors';
import {loadSnippet} from './store/actions';
import * as LocalStorage from './components/LocalStorage';
import debounce from './utils/debounce';
import {parserMiddleware, snippetMiddleware, transformerMiddleware} from './store/middleware';
import {storageAdapter} from './storage/backends';

initWasm();

const composeEnhancers: typeof compose = (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ as typeof compose | undefined) ?? compose;
export const store = createStore(
  astexplorer,
  revive(LocalStorage.readState()),
  composeEnhancers(
    applyMiddleware(snippetMiddleware(storageAdapter), parserMiddleware, transformerMiddleware),
  ),
);
store.subscribe(debounce(() => {
  const state = store.getState();
  // We are not persisting the state while looking at an existing revision
  if (getRevision(state) === null || getRevision(state) === undefined) {
    LocalStorage.writeState(persist(state));
  }
}));
store.dispatch({type: 'INIT'});

window.addEventListener('hashchange', () => {
  store.dispatch(loadSnippet());
});

if (location.hash.length > 1) {
  store.dispatch(loadSnippet());
}

window.addEventListener('beforeunload', (event) => {
  const state = store.getState();
  if (canSaveTransform(state)) {
    event.preventDefault();
  }
});
