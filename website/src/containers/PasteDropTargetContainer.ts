import { connect } from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget';
import { setError, dropText } from '../store/actions';
import type { Dispatch } from 'redux';

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onText: (type: string, event: Event, code: string, categoryId?: string) => {
      if (categoryId !== undefined) {
        dispatch(dropText(code, categoryId));
      }
    },
    onError: (...args: unknown[]) => {
      const error = args[0];
      if (error instanceof Error) {
        dispatch(setError(error));
      }
    },
  };
}

export default connect(undefined, mapDispatchToProps)(PasteDropTarget);
