import {connect} from 'react-redux';
import LoadingIndicator from '../components/LoadingIndicator';
import {isLoadingSnippet} from '../store/selectors';

/**
 * @param {import('../types.js').AppState} state
 */
function mapStateToProps(state) {
  return {
    visible: isLoadingSnippet(state),
  };
}

export default connect(mapStateToProps)(LoadingIndicator);
