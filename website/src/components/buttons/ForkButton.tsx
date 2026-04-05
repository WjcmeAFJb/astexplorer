// oxlint-disable typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames';

type ForkButtonProps = {
  canFork?: boolean;
  saving?: boolean;
  forking?: boolean;
  onFork?: () => void;
};

export default class ForkButton extends React.Component<ForkButtonProps> {
  static displayName = 'ForkButton';
  render() {
    const { canFork, saving, forking, onFork } = this.props;
    return (
      <button
        type="button"
        disabled={
          // oxlint-disable-next-line typescript-eslint/prefer-nullish-coalescing -- boolean logical OR, not nullish coalescing
          !canFork || saving || forking
        }
        onClick={onFork}>
        <i
          className={cx({
            fa: true,
            'fa-spinner': forking,
            'fa-pulse': forking,
            'fa-code-fork': !forking,
            'fa-fw': true,
          })}
        />&nbsp;Fork
      </button>
    );
  }
}

ForkButton.propTypes = {
  canFork: PropTypes.bool,
  saving: PropTypes.bool,
  forking: PropTypes.bool,
  onFork: PropTypes.func,
};
