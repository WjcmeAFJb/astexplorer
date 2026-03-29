import {connect} from 'react-redux';
import PasteDropTarget from '../components/PasteDropTarget';
import {setError, dropText} from '../store/actions';

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onText: (/** @type {string} */ type, /** @type {Event} */ event, /** @type {string} */ code, /** @type {string} */ categoryId) => {
      dispatch(dropText(code, categoryId));
    },
    onError: error => dispatch(setError(error)),
  };
}

export default connect(null, mapDispatchToProps)(PasteDropTarget);
