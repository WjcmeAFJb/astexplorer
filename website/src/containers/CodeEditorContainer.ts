// oxlint-disable typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import {connect} from 'react-redux';
import {setCode, setCursor} from '../store/actions';
import Editor from '../components/Editor';
import {getCode, getParser, getParseResult, getKeyMap} from '../store/selectors';
import type {AppState} from '../types';
import type {Dispatch} from 'redux';

function mapStateToProps(state: AppState) {
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- empty string editorMode should fall back to category.id
    mode: getParser(state).category.editorMode || getParser(state).category.id,
    error: (getParseResult(state) ?? {}).error,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onContentChange: ({value, cursor}: {value: string, cursor: number}) => {
      dispatch(setCode({code: value, cursor}));
    },
    onActivity: (cursor: number) => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
