import {connect} from 'react-redux';
import ErrorMessage from '../components/ErrorMessage';
import {clearError} from '../store/actions';
import {getError} from '../store/selectors';

function mapStateToProps(state: import('../types').AppState) {
  return {
    error: getError(state),
  };
}

function mapDispatchToProps(dispatch: import('redux').Dispatch) {
  return {
    onWantToClose: () => dispatch(clearError()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ErrorMessage);
