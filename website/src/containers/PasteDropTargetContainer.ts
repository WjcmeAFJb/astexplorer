import {connect} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget';
import {setError, dropText} from '../store/actions';
import type {Dispatch} from 'redux';

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onText: (type: string, event: Event, code: string, categoryId: string) => {
      dispatch(dropText(code, categoryId));
    },
    onError: (error: Error) => dispatch(setError(error)),
  };
}

export default connect(null, mapDispatchToProps)(PasteDropTarget);
