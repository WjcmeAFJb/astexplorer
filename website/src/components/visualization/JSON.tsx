import JSONEditor from '../JSONEditor';
import React from 'react';

const globalJSON = globalThis.JSON;

function safeStringify(value: unknown, space: number): string {
  try {
    return globalJSON.stringify(value, null, space);
  } catch {
    return String(value);
  }
}

type JSONViewProps = {
  parseResult: { ast: unknown };
};

export default function JSON({parseResult}: JSONViewProps): React.ReactElement {
  return (
    <JSONEditor
      className="container"
      value={safeStringify(parseResult.ast, 2)}
    />
  );
}
