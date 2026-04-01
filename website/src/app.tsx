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
import ReactDOM from 'react-dom';
// @ts-expect-error — React 18 createRoot exists on react-dom but TypeScript types want react-dom/client
const createRoot: (container: Element) => { render: (element: React.ReactElement) => void } = ReactDOM.createRoot;
import * as gist from './storage/gist';
import * as parse from './storage/parse';
import StorageHandler from './storage';
import '../css/style.css';
import parserMiddleware from './store/parserMiddleware';
import snippetMiddleware from './store/snippetMiddleware';
import transformerMiddleware from './store/transformerMiddleware';
import cx from './utils/classnames';

function resize() {
  publish('PANEL_RESIZE');
}

function App({showTransformer, hasError}: any): React.ReactElement {
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
  state => ({
    showTransformer: state.showTransformPanel,
    hasError: !!state.error,
  }),
)(App);

const composeEnhancers: typeof compose = (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ as typeof compose) || compose;
const storageAdapter = new StorageHandler(([gist, parse] as import('./types').StorageBackend[]));
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
  if (!getRevision(state)) {
    LocalStorage.writeState(persist(state));
  }
}));
store.dispatch({type: 'INIT'} as any);

createRoot(document.getElementById('container')!).render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
);

global.onhashchange = () => {
  store.dispatch(loadSnippet() as any);
};

if (location.hash.length > 1) {
  store.dispatch(loadSnippet() as any);
}

global.onbeforeunload = () => {
  const state = store.getState();
  if (canSaveTransform(state)) {
    return 'You have unsaved transform code. Do you really want to leave?';
  }
};
