import {connect} from 'react-redux';
import {
  save,
  selectCategory,
  openSettingsDialog,
  openShareDialog,
  selectTransformer,
  hideTransformer,
  setParser,
  reset,
  setKeyMap,
} from '../store/actions';
import Toolbar from '../components/Toolbar';
import * as selectors from '../store/selectors';
import type {AppState, Parser, Category, Transformer} from '../types';
import type {Dispatch} from 'redux';

function mapStateToProps(state: AppState) {
  const parser = selectors.getParser(state);

  return {
    forking: selectors.isForking(state),
    saving: selectors.isSaving(state),
    canSave: selectors.canSave(state),
    canFork: selectors.canFork(state),
    category: parser.category,
    parser,
    transformer: selectors.getTransformer(state),
    keyMap: selectors.getKeyMap(state),
    showTransformer: selectors.showTransformer(state),
    snippet: selectors.getRevision(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onParserChange: (parser: Parser) => {
      dispatch(setParser(parser));
    },
    onCategoryChange: (category: Category) => {
      dispatch(selectCategory(category));
    },
    onParserSettingsButtonClick: () => {
      dispatch(openSettingsDialog());
    },
    onShareButtonClick: () => {
      dispatch(openShareDialog());
    },
    onTransformChange: (transformer: Transformer | null) => {
      dispatch(transformer ? selectTransformer(transformer) : hideTransformer());
    },
    onKeyMapChange: (keyMap: string) => {
      dispatch(setKeyMap(keyMap))
    },
    onSave: () => dispatch(save(false)),
    onFork: () => dispatch(save(true)),
    onNew: () => {
      if (window.location.hash) {
        window.location.hash = '';
      } else {
        dispatch(reset());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);

