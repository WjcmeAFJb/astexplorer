import {connect} from 'react-redux';
import {closeSettingsDialog, setParserSettings} from '../store/actions';
import {showSettingsDialog, getParser, getParserSettings} from '../store/selectors';
import SettingsDialog from '../components/dialogs/SettingsDialog';

/**
 * @param {import('../types').AppState} state
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
    onSave: (parser: import('../types').Parser, newSettings: Record<string, unknown>) => dispatch(setParserSettings(newSettings)),
    onWantToClose: () => dispatch(closeSettingsDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDialog);
