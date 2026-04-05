import React from 'react';
import type {Parser} from '../../types';

type SettingsDialogProps = {
  onSave?: (parser: Parser, settings: Record<string, unknown>) => void;
  onWantToClose?: () => void;
  visible?: boolean;
  parser: Parser;
  parserSettings?: Record<string, unknown> | null;
};

export default class SettingsDialog extends React.Component<SettingsDialogProps, {parserSettings: Record<string, unknown> | null}> {
  static displayName = 'SettingsDialog';
    constructor(props: SettingsDialogProps) {
    super(props);
    this.state = {
      parserSettings: this.props.parserSettings,
    };
  }

  componentDidUpdate(prevProps: SettingsDialogProps) {
    if (this.props.parserSettings !== prevProps.parserSettings) {
      this.setState({parserSettings: this.props.parserSettings});
    }
  }

    _outerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === document.querySelector('#SettingsDialog')) {
      this._saveAndClose();
    }
  };

    _onChange = (newSettings: Record<string, unknown>) => {
    this.setState({parserSettings: newSettings});
  };

  _saveAndClose = () => {
    this.props.onSave(this.props.parser, this.state.parserSettings);
    this.props.onWantToClose();
  };

  _reset = () => {
    this.setState({parserSettings: {}});
  };

  render() {
    if (this.props.visible === true && this.props.parser.renderSettings) {
      return (
        <div id="SettingsDialog" className="dialog" role="dialog" onClick={this._outerClick} onKeyDown={(e) => { if (e.key === 'Escape') this._saveAndClose(); }}>
          <div className="inner">
            <div className="header">
              <h3>{this.props.parser.displayName} Settings</h3>
            </div>
            <div className="body">
              {this.props.parser.renderSettings(
                this.state.parserSettings,
                this._onChange,
              )}
            </div>
            <div className="footer">
              <button style={{marginRight: 10}} onClick={this._reset}>
                Reset
              </button>
              <button onClick={this._saveAndClose}>Close</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}

