import React from 'react';
import type { Revision } from '../../types';

type ShareDialogProps = {
  onWantToClose: () => void;
  visible: boolean;
  snippet?: Revision;
};

export default class ShareDialog extends React.Component<ShareDialogProps> {
  static displayName = 'ShareDialog';

  _outerClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === document.querySelector('#ShareDialog')) {
      this.props.onWantToClose();
    }
  };

  render() {
    if (this.props.visible) {
      return (
        <div
          id="ShareDialog"
          className="dialog"
          role="dialog"
          onClick={this._outerClick}
          onKeyDown={(e) => {
            if (e.key === 'Escape') this.props.onWantToClose();
          }}
        >
          <div className="inner" style={{ maxWidth: '80%', width: 600 }}>
            <div className="body">
              {this.props.snippet !== undefined && this.props.snippet.getShareInfo()}
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
