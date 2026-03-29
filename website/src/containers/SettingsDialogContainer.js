import {connect} from 'react-redux';
import {closeSettingsDialog, setParserSettings} from '../store/actions';
import {showSettingsDialog, getParser, getParserSettings} from '../store/selectors';
import SettingsDialog from '../components/dialogs/SettingsDialog';

/**
 * @param {import('../types.js').AppState} state
 */
function mapStateToProps(state) {
  return {
    visible: showSettingsDialog(state),
    parser: getParser(state),
    parserSettings: getParserSettings(state),
  };
}

/**
 * @param {import('redux').Dispatch} dispatch
 */
function mapDispatchToProps(dispatch) {
  return {
    onSave: (parser, newSettings) => dispatch(setParserSettings(newSettings)),
    onWantToClose: () => dispatch(closeSettingsDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDialog);
