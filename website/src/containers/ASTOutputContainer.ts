import {connect} from 'react-redux';
import ASTOutput from '../components/ASTOutput';
import * as selectors from '../store/selectors';
import type {AppState} from '../types';

function mapStateToProps(state: AppState) {
  const parseResult = selectors.getParseResult(state);
  const cursor = selectors.getCursor(state);
  return {
    parseResult: parseResult
      ? {
          ast: parseResult.ast,
          error: parseResult.error ?? undefined,
          time: parseResult.time ?? undefined,
          treeAdapter: parseResult.treeAdapter ?? undefined,
        }
      : undefined,
    position: cursor ?? undefined,
  };
}

export default connect(mapStateToProps)(ASTOutput);
