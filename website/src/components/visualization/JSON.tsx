import JSONEditor from '../JSONEditor';
import PropTypes from 'prop-types';
import React from 'react';

import stringify from 'json-stringify-safe';

type JSONViewProps = {
  parseResult: { ast: unknown };
};

export default function JSON({parseResult}: JSONViewProps): React.ReactElement {
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
