// oxlint-disable typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import PropTypes from 'prop-types';
import React from 'react';

type LoadingIndicatorProps = {
  visible?: boolean;
};

export default function LoadingIndicator(props: LoadingIndicatorProps): React.ReactElement | undefined {
  return props.visible ?
    <div
      className="loadingIndicator cover">
      <div>
        <i className="fa fa-lg fa-spinner fa-pulse"></i>
      </div>
    </div> :
    undefined;
}

LoadingIndicator.propTypes = {
  visible: PropTypes.bool,
};
