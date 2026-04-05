import {connect} from 'react-redux';
import {closeShareDialog} from '../store/actions';
import {showShareDialog, getRevision} from '../store/selectors';
import ShareDialog from '../components/dialogs/ShareDialog';
import type {AppState} from '../types';
import type {Dispatch} from 'redux';

function mapStateToProps(state: AppState) {
  return {
    visible: showShareDialog(state),
    snippet: getRevision(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onWantToClose: () => dispatch(closeShareDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShareDialog);
