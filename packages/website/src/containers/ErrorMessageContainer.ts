import { connect } from 'react-redux';
import ErrorMessage from '../components/ErrorMessage';
import { clearError } from '../store/actions';
import { getError } from '../store/selectors';
import type { AppState } from '../types';
import type { Dispatch } from 'redux';

function mapStateToProps(state: AppState) {
  return {
    error: getError(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onWantToClose: () => dispatch(clearError()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage);
