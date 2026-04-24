import { connect } from 'react-redux';
import Transformer from '../components/Transformer';
import {
  setTransformState,
  setTransformCursor,
  toggleFormatting,
  toggleTransformHover,
} from '../store/actions';
import * as selectors from '../store/selectors';
import type { AppState } from '../types';
import type { Dispatch } from 'redux';

function mapStateToProps(state: AppState) {
  const parser = selectors.getParser(state);
  const editorMode = parser.category.editorMode;
  return {
    transformer: selectors.getTransformer(state),
    transformCode: selectors.getTransformCode(state),
    mode: editorMode !== undefined && editorMode !== '' ? editorMode : parser.category.id,
    enableFormatting: selectors.getFormattingState(state),
    keyMap: selectors.getKeyMap(state),
    transformResult: selectors.getTransformResult(state),
    transforming: selectors.isTransforming(state),
    hoverMode: selectors.getTransformHoverMode(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onContentChange: ({ value, cursor }: { value: string; cursor: number }) => {
      dispatch(setTransformState({ code: value, cursor }));
    },
    onCursorActivity: (cursor: number | null) => {
      dispatch(setTransformCursor(cursor));
    },
    toggleFormatting: () => {
      dispatch(toggleFormatting());
    },
    onToggleHover: () => {
      dispatch(toggleTransformHover());
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Transformer);
