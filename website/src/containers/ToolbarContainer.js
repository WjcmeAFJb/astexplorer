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

/**
 * @param {import('../types.js').AppState} state
 */
function mapStateToProps(state) {
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

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onParserChange: (/** @type {import('../types.js').Parser} */ parser) => {
      dispatch(setParser(parser));
    },
    onCategoryChange: (/** @type {import('../types.js').Category} */ category) => {
      dispatch(selectCategory(category));
    },
    onParserSettingsButtonClick: () => {
      dispatch(openSettingsDialog());
    },
    onShareButtonClick: () => {
      dispatch(openShareDialog());
    },
    onTransformChange: (/** @type {import('../types.js').Transformer | null} */ transformer) => {
      dispatch(transformer ? selectTransformer(transformer) : hideTransformer());
    },
    onKeyMapChange: (/** @type {string} */ keyMap) => {
      dispatch(setKeyMap(keyMap))
    },
    onSave: () => dispatch(save(false)),
    onFork: () => dispatch(save(true)),
    onNew: () => {
      if (global.location.hash) {
        global.location.hash = '';
      } else {
        dispatch(reset());
      }
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar);

