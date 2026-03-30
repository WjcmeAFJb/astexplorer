

import {connect} from 'react-redux';
import ASTOutput from '../components/ASTOutput';
import * as selectors from '../store/selectors';
type AppState = import('../types').AppState;

function mapStateToProps(state: AppState) {
  return {
    parseResult: selectors.getParseResult(state),
    position: selectors.getCursor(state),
  };
}

export default connect(mapStateToProps)(ASTOutput);
