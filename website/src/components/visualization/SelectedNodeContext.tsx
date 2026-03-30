import React from 'react';

type SetSelectedNodeFn = (node: unknown, cb?: () => void) => void;

const SelectedNodeContext: React.Context<SetSelectedNodeFn | undefined> = React.createContext((undefined as SetSelectedNodeFn | undefined));

/**
 * @returns {SetSelectedNodeFn}
 */
function useSelectedNode() {
  const context = React.useContext(SelectedNodeContext);
  if (!context) {
    throw new Error('useSelectedNode must be used within a SelectedNodeContext');
  }
  return context;
}

let unselectCallback: (() => void) | null;

function setSelectedNode(node: unknown, cb?: () => void) {
  if (unselectCallback) {
    unselectCallback();
  }
  if (node) {
    global.$node = node;
    unselectCallback = cb;
  } else {
    unselectCallback = null;
    delete global.$node;
  }
}

function SelectedNodeProvider(props: {children?: React.ReactNode}): React.ReactElement {
  return <SelectedNodeContext.Provider value={setSelectedNode} {...props} />;
}

export {SelectedNodeProvider, useSelectedNode};
