import { connect } from 'react-redux';
import { closeSettingsDialog, setParserSettings } from '../store/actions';
import { showSettingsDialog, getParser, getParserSettings } from '../store/selectors';
import SettingsDialog from '../components/dialogs/SettingsDialog';
import type { AppState, Parser } from '../types';
import type { Dispatch } from 'redux';

function mapStateToProps(state: AppState) {
  return {
    visible: showSettingsDialog(state),
    parser: getParser(state),
    parserSettings: getParserSettings(state),
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    onSave: (parser: Parser, newSettings: Record<string, unknown>) =>
      dispatch(setParserSettings(newSettings)),
    onWantToClose: () => dispatch(closeSettingsDialog()),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SettingsDialog);
