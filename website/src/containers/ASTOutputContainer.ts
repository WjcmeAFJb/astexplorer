import { connect } from 'react-redux';
import ASTOutput from '../components/ASTOutput';
import * as selectors from '../store/selectors';
import type { AppState } from '../types';

function mapStateToProps(state: AppState) {
  return {
    parseResult: selectors.getParseResult(state),
    position: selectors.getCursor(state) ?? undefined,
  };
}

export default connect(mapStateToProps)(ASTOutput);
