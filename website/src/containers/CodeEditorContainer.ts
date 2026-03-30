/** @typedef {import('../types').AppState} AppState */

import {connect} from 'react-redux';
import {setCode, setCursor} from '../store/actions';
import Editor from '../components/Editor';
import {getCode, getParser, getParseResult, getKeyMap} from '../store/selectors';

/**
 * @param {AppState} state
 */
function mapStateToProps(state) {
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
  };
}

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onContentChange: (/** @type {{value: string, cursor: number}} */ {value, cursor}) => {
      dispatch(setCode({code: value, cursor}));
    },
    onActivity: (cursor: number) => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
