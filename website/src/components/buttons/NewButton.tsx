// oxlint-disable typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import PropTypes from 'prop-types';
import React from 'react';

type NewButtonProps = {
  saving?: boolean;
  forking?: boolean;
  onNew?: () => void;
};

export default function SaveButton({saving, forking, onNew}: NewButtonProps): React.ReactElement {
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

