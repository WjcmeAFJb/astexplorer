import type { AppState } from './types';
import {
  ASTOutputContainer,
  CodeEditorContainer,
  ErrorMessageContainer,
  LoadingIndicatorContainer,
  PasteDropTargetContainer,
  SettingsDialogContainer,
  ShareDialogContainer,
  ToolbarContainer,
  TransformerContainer,
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
        <SettingsDialogContainer />
        <ShareDialogContainer />
        <ToolbarContainer />
        <GistBanner />
        <SplitPane className="splitpane-content" vertical={true} onResize={resize}>
          <SplitPane className="splitpane" onResize={resize}>
            <CodeEditorContainer />
            <ASTOutputContainer />
          </SplitPane>
          {showTransformer ? <TransformerContainer /> : null}
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
