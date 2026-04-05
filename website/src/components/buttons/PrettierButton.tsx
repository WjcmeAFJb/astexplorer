// oxlint-disable typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames';

type PrettierButtonProps = {
  toggleFormatting?: () => void;
  enableFormatting?: boolean;
};

export default function PrettierButton(props: PrettierButtonProps): React.ReactElement {
  return (<button type="button"
            className="toggleBtn"
            onClick={props.toggleFormatting}>
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-toggle-off': !props.enableFormatting,
              'fa-toggle-on': props.enableFormatting,
              'fa-fw': true,
            })}
          />
          <span className="btnText">Prettier</span>
      </button>);
}

PrettierButton.propTypes = {
  toggleFormatting: PropTypes.func,
  enableFormatting: PropTypes.bool,
}
