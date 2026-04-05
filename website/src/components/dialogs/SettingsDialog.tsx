// oxlint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, typescript-eslint/strict-boolean-expressions -- dialog backdrop: click-outside-to-close pattern does not need keyboard equivalent; legacy untyped code
import PropTypes from 'prop-types';
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
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._outerClick = this._outerClick.bind(this);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._onChange = this._onChange.bind(this);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._reset = this._reset.bind(this);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._saveAndClose = this._saveAndClose.bind(this);
    this.state = {
      parserSettings: this.props.parserSettings,
    };
  }

  componentDidUpdate(prevProps: SettingsDialogProps) {
    if (this.props.parserSettings !== prevProps.parserSettings) {
      this.setState({parserSettings: this.props.parserSettings});
    }
  }

    _outerClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === document.querySelector('#SettingsDialog')) {
      this._saveAndClose();
    }
  }

    _onChange(newSettings: Record<string, unknown>) {
    this.setState({parserSettings: newSettings});
  }

  _saveAndClose() {
    this.props.onSave(this.props.parser, this.state.parserSettings);
    this.props.onWantToClose();
  }

  _reset() {
    this.setState({parserSettings: {}});
  }

  render() {
    if (this.props.visible && this.props.parser.renderSettings) {
      return (
        <div id="SettingsDialog" className="dialog" onClick={this._outerClick}>
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
    // oxlint-disable-next-line unicorn/no-null -- React render: null is the standard way to render nothing
    return null;
  }
}

SettingsDialog.propTypes = {
  onSave: PropTypes.func,
  onWantToClose: PropTypes.func,
  visible: PropTypes.bool,
  parser: PropTypes.object.isRequired,
  parserSettings: PropTypes.object,
};
