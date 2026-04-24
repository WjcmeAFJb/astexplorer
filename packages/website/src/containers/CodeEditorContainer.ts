import { connect } from 'react-redux';
import { setCode, setCursor } from '../store/actions';
import Editor from '../components/Editor';
import { getCode, getParser, getParseResult, getKeyMap } from '../store/selectors';
import type { AppState } from '../types';
import type { Dispatch } from 'redux';

function mapStateToProps(state: AppState) {
  const parser = getParser(state);
  const editorMode = parser.category.editorMode;
  return {
    keyMap: getKeyMap(state),
    value: getCode(state),
    mode: editorMode !== undefined && editorMode !== '' ? editorMode : parser.category.id,
    error: getParseResult(state)?.error ?? undefined,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onContentChange: ({ value, cursor }: { value: string; cursor: number }) => {
      dispatch(setCode({ code: value, cursor }));
    },
    onActivity: (cursor: number) => dispatch(setCursor(cursor)),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Editor);
