import React from 'react';

type ErrorMessageProps = {
  onWantToClose?: () => void;
  error?: Error | null;
};

export default class ErrorMessage extends React.Component<ErrorMessageProps> {
  static displayName = 'ErrorMessage';
  render() {
    return this.props.error ?
      <div className="cover">
        <div className="errorMessage">
          <h3>
            <i className="fa fa-exclamation-triangle"></i>
            {' '}
            Error
          </h3>
          <div>{this.props.error.message}</div>
          <div style={{marginTop: 15}}>
            <button
              type="button"
              onClick={this.props.onWantToClose}>
              OK
            </button>
          </div>
        </div>
      </div> :
      null;
  }
}

