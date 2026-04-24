import React from 'react';

type CompactArrayViewProps = {
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
  array?: unknown[];
};

export default class CompactArrayView extends React.Component<CompactArrayViewProps> {
  static displayName = 'CompactArrayView';
  shouldComponentUpdate(nextProps: CompactArrayViewProps) {
    return (nextProps.array?.length ?? 0) !== (this.props.array?.length ?? 0);
  }

  render() {
    let { array } = this.props;
    let count = array?.length ?? 0;

    if (count === 0) {
      return <span className="p">{'[ ]'}</span>;
    }
    return (
      <span>
        <span className="p">{'['}</span>
        <button
          className="compact placeholder ge"
          tabIndex={0}
          onClick={this.props.onClick}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && this.props.onClick) this.props.onClick(e);
          }}
        >
          {count + ' element' + (count > 1 ? 's' : '')}
        </button>
        <span className="p">{']'}</span>
      </span>
    );
  }
}
