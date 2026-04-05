import PropTypes from 'prop-types';
import React from 'react';

type CompactArrayViewProps = {
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  array?: unknown[];
};

export default class CompactArrayView extends React.Component<CompactArrayViewProps> {
  static displayName = 'CompactArrayView';
    shouldComponentUpdate(nextProps: CompactArrayViewProps) {
    return nextProps.array.length !== this.props.array.length;
  }

  render() {
    let {array} = this.props;
    let count = array.length;

    if (count === 0) {
      return <span className="p">{'[ ]'}</span>;
    }
    return (
      <span>
        <span className="p">{'['}</span>
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- must remain a span to preserve tree node inline styling */}
        <span className="compact placeholder ge" role="button" tabIndex={0} onClick={this.props.onClick} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && this.props.onClick) this.props.onClick(e); }}>
          {count + ' element' + (count > 1 ? 's' : '')}
        </span>
        <span className="p">{']'}</span>
      </span>
    );
  }
}

CompactArrayView.propTypes = {
  /**
   * The array of elements to represent.
   */
  array: PropTypes.oneOfType([
    PropTypes.array,
    PropTypes.shape({ length: PropTypes.number }),
  ]).isRequired,
  onClick: PropTypes.func,
};
