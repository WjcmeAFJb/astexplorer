import Element from './tree/Element';
import PropTypes from 'prop-types';
import React from 'react';
import {publish} from '../../utils/pubsub';
import {treeAdapterFromParseResult} from '../../core/TreeAdapter';
import {SelectedNodeProvider} from './SelectedNodeContext';
import focusNodes from './focusNodes'

import './css/tree.css'

const {useReducer, useMemo, useRef, useLayoutEffect} = React;

const STORAGE_KEY = 'tree_settings';

/**
 * @returns {Record<string, boolean>}
 */
function initSettings() {
  const storedSettings = window.localStorage.getItem(STORAGE_KEY);
  return storedSettings ?
    (JSON.parse(storedSettings) as Record<string, boolean>) :
    {
      autofocus: true,
      hideFunctions: true,
      hideEmptyKeys: false,
      hideLocationData: false,
      hideTypeKeys: false,
    };
}

function reducer(state: Record<string, boolean>, element: any): Record<string, boolean> {
  const newState = {...state, [element.name]: element.checked};

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
  return newState;
}

function makeCheckbox(name: string, settings: Record<string, boolean>, updateSettings: any): React.ReactElement {
  return (
    <input
      type="checkbox"
      name={name}
      checked={settings[name]}
      onChange={event => updateSettings(event.target)}
    />
  );
}

export default function Tree({parseResult, position}: any): React.ReactElement {
  const [settings, updateSettings] = useReducer(reducer, null, initSettings);
  const treeAdapter = useMemo(
    () => treeAdapterFromParseResult(parseResult, settings),
    [parseResult.treeAdapter, settings],
  );
  const rootElement = useRef((null as HTMLUListElement | null));

  focusNodes('init');
  useLayoutEffect(() => {
    focusNodes('focus', rootElement);
  });

  return (
    <div className="tree-visualization container">
      <div className="toolbar">
        <label title="Auto open the node at the cursor in the source code">
          {makeCheckbox('autofocus', settings, updateSettings)}
          Autofocus
        </label>
        &#8203;
        {treeAdapter.getConfigurableFilters().map(filter => (
          <span key={filter.key}>
            <label>
              {makeCheckbox(filter.key, settings, updateSettings)}
              {filter.label}
            </label>
            &#8203;
          </span>
        ))}
      </div>
      <ul ref={rootElement} onMouseLeave={() => {publish('CLEAR_HIGHLIGHT');}}>
        <SelectedNodeProvider>
          <Element
            value={parseResult.ast}
            level={0}
            treeAdapter={treeAdapter}
            autofocus={settings.autofocus}
            position={position}
          />
        </SelectedNodeProvider>
      </ul>
    </div>
  );
}

Tree.propTypes = {
  parseResult: PropTypes.object,
  position: PropTypes.number,
};
