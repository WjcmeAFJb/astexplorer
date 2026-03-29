import { connect } from 'react-redux';
import { expandSettingsDrawer, collapseSettingsDrawer } from '../store/actions';
import { showSettingsDrawer } from '../store/selectors';
import SettingsDrawer from '../components/SettingsDrawer';

/**
 * @param {import('../types.js').AppState} state
 */
function mapStateToProps(state) {
  return {
    isOpen: showSettingsDrawer(state),
  };
}

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onWantToExpand: () => dispatch(expandSettingsDrawer()),
    onWantToCollapse: () => dispatch(collapseSettingsDrawer()),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(SettingsDrawer);
