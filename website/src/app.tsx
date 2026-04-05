// oxlint-disable import/max-dependencies -- app entry point necessarily imports all containers and stores
import type {StorageBackend, AppState} from './types';
import type {AnyAction} from 'redux';
import * as LocalStorage from './components/LocalStorage';
import ASTOutputContainer from './containers/ASTOutputContainer';
import CodeEditorContainer from './containers/CodeEditorContainer';
import ErrorMessageContainer from './containers/ErrorMessageContainer';
import GistBanner from './components/GistBanner';
import LoadingIndicatorContainer from './containers/LoadingIndicatorContainer';
import PasteDropTargetContainer from './containers/PasteDropTargetContainer';
import PropTypes from 'prop-types';
import {publish} from './utils/pubsub';
import * as React from 'react';
import SettingsDialogContainer from './containers/SettingsDialogContainer';
import ShareDialogContainer from './containers/ShareDialogContainer';
import SplitPane from './components/SplitPane';
import ToolbarContainer from './containers/ToolbarContainer';
import TransformerContainer from './containers/TransformerContainer';
import debounce from './utils/debounce';
import {Provider, connect} from 'react-redux';
import {astexplorer, persist, revive} from './store/reducers';
import {createStore, applyMiddleware, compose} from 'redux';
import {canSaveTransform, getRevision} from './store/selectors';
import {loadSnippet} from './store/actions';
import {createRoot} from 'react-dom/client';
import * as gist from './storage/gist';
import * as parse from './storage/parse';
import StorageHandler from './storage';
import '../css/style.css';
import {configureWasm} from 'astexplorer-parsers';
import swcWasm from 'astexplorer-parsers/swc.wasm';
import synWasm from 'astexplorer-parsers/syn.wasm';
import goWasm from 'astexplorer-parsers/go.wasm';
import monkeyWasm from 'astexplorer-parsers/monkey.wasm';
import parserMiddleware from './store/parserMiddleware';
import snippetMiddleware from './store/snippetMiddleware';
import transformerMiddleware from './store/transformerMiddleware';
import cx from './utils/classnames';

configureWasm({ swc: swcWasm, syn: synWasm, go: goWasm, monkey: monkeyWasm });

function resize() {
  publish('PANEL_RESIZE');
}

function App({showTransformer, hasError}: {showTransformer: boolean, hasError: boolean}): React.ReactElement {
  return (
    <>
      <ErrorMessageContainer />
      <PasteDropTargetContainer id="main" className={cx({hasError})}>
        <LoadingIndicatorContainer />
        <SettingsDialogContainer />
        <ShareDialogContainer />
        <ToolbarContainer />
        <GistBanner />
        <SplitPane
          className="splitpane-content"
          vertical={true}
          onResize={resize}>
          <SplitPane
            className="splitpane"
            onResize={resize}>
            <CodeEditorContainer />
            <ASTOutputContainer />
          </SplitPane>
          {/* oxlint-disable-next-line unicorn/no-null -- React conditional rendering requires null to render nothing */}
          {showTransformer ? <TransformerContainer /> : null}
        </SplitPane>
      </PasteDropTargetContainer>
    </>
  );
}

App.propTypes = {
  hasError: PropTypes.bool,
  showTransformer: PropTypes.bool,
};

const AppContainer = connect(
  (state: AppState) => ({
    showTransformer: state.showTransformPanel,
    hasError: state.error !== null,
  }),
)(App);

// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- Redux DevTools extension injects untyped compose; cast is safe
const composeEnhancers: typeof compose = (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ as typeof compose) ?? compose;
// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- gist/parse modules satisfy StorageBackend at runtime; TS modules lack direct type export
const storageAdapter = new StorageHandler(([gist, parse] as StorageBackend[]));
const store = createStore(
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
// oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- INIT action is a custom bootstrap type not in the Redux Action union
store.dispatch({type: 'INIT'} as AnyAction);

createRoot(document.querySelector('#container')!).render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
);

window.addEventListener('hashchange', () => {
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- loadSnippet() returns a typed action but store.dispatch expects AnyAction
  store.dispatch(loadSnippet() as AnyAction);
});

if (location.hash.length > 1) {
  // oxlint-disable-next-line typescript-eslint(no-unsafe-type-assertion) -- loadSnippet() returns a typed action but store.dispatch expects AnyAction
  store.dispatch(loadSnippet() as AnyAction);
}

window.addEventListener('beforeunload', (event) => {
  const state = store.getState();
  if (canSaveTransform(state)) {
    event.preventDefault();
  }
});
