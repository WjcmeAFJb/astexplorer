import JSONEditor from '../JSONEditor';
import PropTypes from 'prop-types';
import React from 'react';

import stringify from 'json-stringify-safe';

/**
 * @param {Object} props
 * @param {import('../../types').ParseResult} props.parseResult
 * @returns {React.ReactElement}
 */
export default function JSON({parseResult}) {
  return (
    <JSONEditor
      className="container"
      value={stringify(parseResult.ast, null, 2)}
    />
  );
}

JSON.propTypes = {
  parseResult: PropTypes.object,
};
