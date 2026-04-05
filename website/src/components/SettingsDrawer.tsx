import PropTypes from 'prop-types';
import React from 'react';

type SettingsDrawerProps = {
  onWantToExpand?: () => void;
  onWantToCollapse?: () => void;
  isOpen?: boolean;
};

export default class SettingsDrawer extends React.Component<SettingsDrawerProps> {
  static displayName = 'SettingsDrawer';

  _expand = () => {
    this.props.onWantToExpand?.();
  };

  _collapse = () => {
    this.props.onWantToCollapse?.();
  };

  render() {
    return (
      this.props.isOpen === true ?
        <div className='settings-drawer__expanded'>
          <h3>Settings</h3>
          <button onClick={this._collapse}>Close</button>
        </div>
      :
        <button className='settings-drawer__collapsed' tabIndex={0} onClick={this._expand} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') this._expand(); }}></button>
    );
  }
}

SettingsDrawer.propTypes = {
  onWantToExpand: PropTypes.func,
  onWantToCollapse: PropTypes.func,
  isOpen: PropTypes.bool,
};
