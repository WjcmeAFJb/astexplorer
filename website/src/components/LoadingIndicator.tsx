import PropTypes from 'prop-types';
import React from 'react';

type LoadingIndicatorProps = {
  visible?: boolean;
};

export default function LoadingIndicator(props: LoadingIndicatorProps): React.ReactElement | undefined {
  if (props.visible === true) {
    return (
      <div className="loadingIndicator cover">
        <div>
          <i className="fa fa-lg fa-spinner fa-pulse"></i>
        </div>
      </div>
    );
  }
  return undefined;
}

LoadingIndicator.propTypes = {
  visible: PropTypes.bool,
};
