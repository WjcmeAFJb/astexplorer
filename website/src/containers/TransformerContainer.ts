import {connect} from 'react-redux';
import Transformer from '../components/Transformer';
import {setTransformState, toggleFormatting} from '../store/actions';
import * as selectors from '../store/selectors';
import type {AppState} from '../types';
import type {Dispatch} from 'redux';

function mapStateToProps(state: AppState) {
  const parser = selectors.getParser(state);
  const editorMode = parser.category.editorMode;
  return {
    transformer: selectors.getTransformer(state),
    // Either the transform example or the transform code from the current
    // revision. This is what we compare against to determine whether something
    // changed and we can save.
    defaultTransformCode: selectors.getInitialTransformCode(state),
    transformCode: selectors.getTransformCode(state),
    mode: editorMode !== undefined && editorMode !== '' ? editorMode : parser.category.id,
    enableFormatting: selectors.getFormattingState(state),
    keyMap: selectors.getKeyMap(state),
    transformResult: selectors.getTransformResult(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onContentChange: ({value, cursor}: {value: string, cursor: number}) => {
      dispatch(setTransformState({code: value, cursor}));
    },
    toggleFormatting: () => {
      dispatch(toggleFormatting());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Transformer);
