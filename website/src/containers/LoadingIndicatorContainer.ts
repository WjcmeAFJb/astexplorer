import { connect } from 'react-redux';
import LoadingIndicator from '../components/LoadingIndicator';
import { isLoadingSnippet } from '../store/selectors';
import type { AppState } from '../types';

function mapStateToProps(state: AppState) {
  return {
    visible: isLoadingSnippet(state),
  };
}

export default connect(mapStateToProps)(LoadingIndicator);
