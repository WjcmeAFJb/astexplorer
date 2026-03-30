import {connect} from 'react-redux';
import {closeShareDialog} from '../store/actions';
import {showShareDialog, getRevision} from '../store/selectors';
import ShareDialog from '../components/dialogs/ShareDialog';

function mapStateToProps(state: import('../types').AppState) {
  return {
    visible: showShareDialog(state),
    snippet: getRevision(state),
  };
}

function mapDispatchToProps(dispatch: import('redux').Dispatch) {
  return {
    onWantToClose: () => dispatch(closeShareDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareDialog);
