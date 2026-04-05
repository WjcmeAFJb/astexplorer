import PropTypes from 'prop-types';
import React from 'react';

type ShareButtonProps = {
  onShareButtonClick?: () => void;
  snippet?: unknown;
};

export default function ShareButton({onShareButtonClick, snippet}: ShareButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      disabled={snippet === undefined || snippet === null}
      onClick={onShareButtonClick}>
      <i className="fa fa-share fa-fw" />&nbsp;Share...
    </button>
  );
}

ShareButton.propTypes = {
  onShareButtonClick: PropTypes.func.isRequired,
  snippet: PropTypes.object,
};
