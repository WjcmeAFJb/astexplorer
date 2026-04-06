import React from 'react';

type NewButtonProps = {
  saving?: boolean;
  forking?: boolean;
  onNew?: () => void;
};

export default function SaveButton({ saving, forking, onNew }: NewButtonProps): React.ReactElement {
  return (
    <button type="button" disabled={saving === true || forking === true} onClick={onNew}>
      <i className="fa fa-file-o fa-fw" />
      &nbsp;New
    </button>
  );
}
