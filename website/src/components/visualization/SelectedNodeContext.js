import React from 'react';

/**
 * @typedef {(node: unknown, cb?: () => void) => void} SetSelectedNodeFn
 */

/** @type {React.Context<SetSelectedNodeFn | undefined>} */
const SelectedNodeContext = React.createContext(/** @type {SetSelectedNodeFn | undefined} */ (undefined));

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

/** @type {(() => void) | null} */
let unselectCallback;

/**
 * @param {unknown} node
 * @param {() => void} [cb]
 */
function setSelectedNode(node, cb) {
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

/**
 * @param {Object} props
 * @param {React.ReactNode} [props.children]
 * @returns {React.ReactElement}
 */
function SelectedNodeProvider(props) {
  return <SelectedNodeContext.Provider value={setSelectedNode} {...props} />;
}

export {SelectedNodeProvider, useSelectedNode};
