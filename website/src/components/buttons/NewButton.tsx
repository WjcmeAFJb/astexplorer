import PropTypes from 'prop-types';
import React from 'react';

/**
 * @param {Object} props
 * @param {boolean} [props.saving]
 * @param {boolean} [props.forking]
 * @param {() => void} [props.onNew]
 * @returns {React.ReactElement}
 */
export default function SaveButton({saving, forking, onNew}) {
  return (
    <button
      type="button"
      disabled={saving || forking}
      onClick={onNew}>
      <i className="fa fa-file-o fa-fw" />&nbsp;New
    </button>
  );
}

SaveButton.propTypes = {
  saving: PropTypes.bool,
  forking: PropTypes.bool,
  onNew: PropTypes.func,
};

