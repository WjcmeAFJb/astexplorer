import PropTypes from 'prop-types';
import React from 'react';

/**
 * @param {Object} props
 * @param {() => void} [props.onShareButtonClick]
 * @param {import('../../types').Revision} [props.snippet]
 * @returns {React.ReactElement}
 */
export default function ShareButton({onShareButtonClick, snippet}) {
  return (
    <button
      type="button"
      disabled={!snippet}
      onClick={onShareButtonClick}>
      <i className="fa fa-share fa-fw" />&nbsp;Share...
    </button>
  );
}

ShareButton.propTypes = {
  onShareButtonClick: PropTypes.func.isRequired,
  snippet: PropTypes.object,
};
