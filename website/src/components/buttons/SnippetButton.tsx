import React from 'react';
import ForkButton from './ForkButton';
import NewButton from './NewButton';
import SaveButton from './SaveButton';
import ShareButton from './ShareButton';
import cx from '../../utils/classnames';

type SnippetButtonProps = {
  canFork?: boolean;
  canSave?: boolean;
  forking?: boolean;
  saving?: boolean;
  onFork?: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onShareButtonClick?: () => void;
  snippet?: unknown;
};

export default function SnippetButton(props: SnippetButtonProps): React.ReactElement {
  const canForkAndNotSave = props.canFork === true && props.canSave !== true;
  const savingOrForking = props.saving === true || props.forking === true;

  return (
    <div className="button menuButton">
      <span>
        <i className='fa fa-lg fa-file-code-o fa-fw' />
        &nbsp;Snippet
      </span>
      <ul>
        <li><NewButton {...props} /></li>
        <li><SaveButton {...props} /></li>
        <li><ForkButton {...props} /></li>
        <li><ShareButton {...props}/></li>
      </ul>
      <button
        type="button"
        title={canForkAndNotSave ? 'Fork' : 'Save'}
        style={{minWidth: 0}}
        disabled={
          savingOrForking || (props.canSave !== true && props.canFork !== true)
        }
        onClick={canForkAndNotSave ? props.onFork : props.onSave}>
        <i
          className={cx({
            fa: true,
            'fa-spinner': savingOrForking,
            'fa-pulse': savingOrForking,
            'fa-floppy-o': !savingOrForking && !canForkAndNotSave,
            'fa-code-fork': !savingOrForking && canForkAndNotSave,
            'fa-fw': true,
          })}
        />
      </button>
    </div>
  );
}

