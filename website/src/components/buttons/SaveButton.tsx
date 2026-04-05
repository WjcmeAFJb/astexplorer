import React from 'react';
import cx from '../../utils/classnames';

type SaveButtonProps = {
  canSave?: boolean;
  saving?: boolean;
  forking?: boolean;
  onSave?: () => void;
};

export default function SaveButton({canSave, saving, forking, onSave}: SaveButtonProps): React.ReactElement {
  return (
    <button
      type="button"
      disabled={
        canSave !== true || saving === true || forking === true
      }
      onClick={onSave}>
      <i
        className={cx({
          fa: true,
          'fa-spinner': saving === true,
          'fa-pulse': saving === true,
          'fa-floppy-o': saving !== true,
          'fa-fw': true,
        })}
      />&nbsp;Save
    </button>
  );
}

