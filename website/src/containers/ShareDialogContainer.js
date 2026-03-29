import {connect} from 'react-redux';
import {closeShareDialog} from '../store/actions';
import {showShareDialog, getRevision} from '../store/selectors';
import ShareDialog from '../components/dialogs/ShareDialog';

/**
 * @param {import('../types.js').AppState} state
 */
function mapStateToProps(state) {
  return {
    visible: showShareDialog(state),
    snippet: getRevision(state),
  };
}

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onWantToClose: () => dispatch(closeShareDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareDialog);
