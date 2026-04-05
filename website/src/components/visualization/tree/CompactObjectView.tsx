import PropTypes from 'prop-types';
import React from 'react';

type CompactObjectViewProps = {
  keys: string[];
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
};

export default function CompactObjectView({keys, onClick}: CompactObjectViewProps): React.ReactElement {
  if (keys.length === 0) {
    return <span className="p">{'{ }'}</span>;
  }
  if (keys.length > 5) {
    keys = keys.slice(0, 5).concat([`... +${keys.length - 5}`]);
  }
  return (
    <span>
      <span className="p">{'{'}</span>
      <button className="compact placeholder ge" tabIndex={0} onClick={onClick} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClick) onClick(e); }}>
        {keys.join(', ')}
      </button>
      <span className="p">{'}'}</span>
    </span>
  );
}

CompactObjectView.propTypes = {
  keys: PropTypes.arrayOf(PropTypes.string).isRequired,
  onClick: PropTypes.func,
};
