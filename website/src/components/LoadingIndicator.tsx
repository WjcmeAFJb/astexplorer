import PropTypes from 'prop-types';
import React from 'react';

export default function LoadingIndicator(props?: any): React.ReactElement | null {
  return props.visible ?
    <div
      className="loadingIndicator cover">
      <div>
        <i className="fa fa-lg fa-spinner fa-pulse"></i>
      </div>
    </div> :
    null;
}

LoadingIndicator.propTypes = {
  visible: PropTypes.bool,
};
