import PropTypes from 'prop-types';
import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} [props.visible]
 * @returns {React.ReactElement | null}
 */
export default function LoadingIndicator(props) {
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
