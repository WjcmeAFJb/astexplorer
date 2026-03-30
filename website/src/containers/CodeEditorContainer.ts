

import {connect} from 'react-redux';
import {setCode, setCursor} from '../store/actions';
import Editor from '../components/Editor';
import {getCode, getParser, getParseResult, getKeyMap} from '../store/selectors';
import type { AppState } from '../types';

function mapStateToProps(state: AppState) {
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) || {}).error,
  };
}

function mapDispatchToProps(dispatch: import('redux').Dispatch) {
  return {
    onContentChange: ({value, cursor}: {value: string, cursor: number}) => {
      dispatch(setCode({code: value, cursor}));
    },
    onActivity: (cursor: number) => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
