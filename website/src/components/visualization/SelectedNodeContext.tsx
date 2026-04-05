import React from 'react';

type SetSelectedNodeFn = (node: unknown, cb?: () => void) => void;

const SelectedNodeContext: React.Context<SetSelectedNodeFn | undefined> = React.createContext((undefined as SetSelectedNodeFn | undefined));

/**
 * @returns {SetSelectedNodeFn}
 */
function useSelectedNode() {
  const context = React.useContext(SelectedNodeContext);
  if (context === undefined) {
    throw new Error('useSelectedNode must be used within a SelectedNodeContext');
  }
  return context;
}

let unselectCallback: (() => void) | null;

function setSelectedNode(node: unknown, cb?: () => void) {
  if (unselectCallback !== undefined && unselectCallback !== null) {
    unselectCallback();
  }
  if (node !== null && node !== undefined) {
    globalThis.$node = node;
    unselectCallback = cb;
  } else {
    // oxlint-disable-next-line unicorn/no-null -- clearing callback reference when deselecting a node
    unselectCallback = null;
    delete globalThis.$node;
  }
}

function SelectedNodeProvider(props: {children?: React.ReactNode}): React.ReactElement {
  return <SelectedNodeContext.Provider value={setSelectedNode} {...props} />;
}

export {SelectedNodeProvider, useSelectedNode};
