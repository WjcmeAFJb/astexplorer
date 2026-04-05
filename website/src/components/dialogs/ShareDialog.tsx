import PropTypes from 'prop-types';
import React from 'react';
import type {Revision} from '../../types';

type ShareDialogProps = {
  onWantToClose: () => void;
  visible: boolean;
  snippet?: Revision;
};

export default class ShareDialog extends React.Component<ShareDialogProps> {
  static displayName = 'ShareDialog';
    constructor(props: ShareDialogProps) {
    super(props);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._outerClick = this._outerClick.bind(this);
  }

    _outerClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === document.querySelector('#ShareDialog')) {
      this.props.onWantToClose();
    }
  }

  render() {
    if (this.props.visible) {
      return (
        <div id="ShareDialog" className="dialog" onClick={this._outerClick}>
          <div className="inner" style={{maxWidth: '80%', width: 600}}>
            <div className="body">
              {this.props.snippet.getShareInfo()}
            </div>
            <div className="footer">
              <button onClick={this.props.onWantToClose}>Close</button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }
}

ShareDialog.propTypes = {
  onWantToClose: PropTypes.func.isRequired,
  visible: PropTypes.bool.isRequired,
  snippet: PropTypes.object,
};
