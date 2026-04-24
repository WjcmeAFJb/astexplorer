import './monacoWorkers';
import type { AppState } from './types';
import {
  ASTOutputContainer,
  CodeEditorContainer,
  ErrorMessageContainer,
  LoadingIndicatorContainer,
  PasteDropTargetContainer,
  ToolbarContainer,
} from './containers';
import GistBanner from './components/GistBanner';
import { publish } from './utils/pubsub';
import * as React from 'react';
import SplitPane from './components/SplitPane';
import { Provider, connect } from 'react-redux';
import { createRoot } from 'react-dom/client';
import { store } from './storeSetup';
import '../css/style.css';
import cx from './utils/classnames';

const { lazy, Suspense } = React;

// Lazy-load components that are conditionally rendered or rarely used
const SettingsDialogContainer = lazy(() => import('./containers/SettingsDialogContainer'));
const ShareDialogContainer = lazy(() => import('./containers/ShareDialogContainer'));
const TransformerContainer = lazy(() => import('./containers/TransformerContainer'));

function resize() {
  publish('PANEL_RESIZE');
}

function App({
  showTransformer,
  hasError,
}: {
  showTransformer: boolean;
  hasError: boolean;
}): React.ReactElement {
  return (
    <>
      <ErrorMessageContainer />
      <PasteDropTargetContainer id="main" className={cx({ hasError })}>
        <LoadingIndicatorContainer />
        <Suspense fallback={null}>
          <SettingsDialogContainer />
        </Suspense>
        <Suspense fallback={null}>
          <ShareDialogContainer />
        </Suspense>
        <ToolbarContainer />
        <GistBanner />
        <SplitPane className="splitpane-content" vertical={true} onResize={resize}>
          <SplitPane className="splitpane" onResize={resize}>
            <CodeEditorContainer />
            <ASTOutputContainer />
          </SplitPane>
          {showTransformer ? (
            <Suspense fallback={null}>
              <TransformerContainer />
            </Suspense>
          ) : null}
        </SplitPane>
      </PasteDropTargetContainer>
    </>
  );
}

const AppContainer = connect((state: AppState) => ({
  showTransformer: state.showTransformPanel,
  hasError: state.error !== null,
}))(App);

createRoot(document.querySelector('#container')!).render(
  <Provider store={store}>
    <AppContainer />
  </Provider>,
);
