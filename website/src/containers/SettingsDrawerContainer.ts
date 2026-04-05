import { connect } from 'react-redux';
import { expandSettingsDrawer, collapseSettingsDrawer } from '../store/actions';
import { showSettingsDrawer } from '../store/selectors';
import SettingsDrawer from '../components/SettingsDrawer';
import type { AppState } from '../types';
import type { Dispatch } from 'redux';

function mapStateToProps(state: AppState) {
  return {
    isOpen: showSettingsDrawer(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onWantToExpand: () => dispatch(expandSettingsDrawer()),
    onWantToCollapse: () => dispatch(collapseSettingsDrawer()),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SettingsDrawer);
