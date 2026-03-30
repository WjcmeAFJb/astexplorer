import {connect} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget';
import {setError, dropText} from '../store/actions';

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onText: (type: string, event: Event, code: string, categoryId: string) => {
      dispatch(dropText(code, categoryId));
    },
    onError: (error: Error) => dispatch(setError(error)),
  };
}

export default connect(null, mapDispatchToProps)(PasteDropTarget);
