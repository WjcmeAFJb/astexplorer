/*eslint no-new-func: 0*/
import Editor from './Editor';
import JSONEditor from './JSONEditor';
import * as React from 'react';
import type { TransformResult, SourceMapConsumer } from '../types';

function safeStringify(value: unknown, space: number): string {
  try {
    return JSON.stringify(value, null, space);
  } catch {
    return String(value);
  }
}

function positionFromIndex(
  index: number,
  map: SourceMapConsumer | null | undefined,
): { line: number; ch: number } | undefined {
  if (map === null || map === undefined) {
    return undefined;
  }
  const src = map.sourcesContent[0];
  if (index === 0) {
    return { line: 0, ch: 0 };
  }
  let lineStart = src.lastIndexOf('\n', index - 1);
  let column = index - lineStart - 1;
  let line = 1;
  while (lineStart > 0) {
    lineStart = src.lastIndexOf('\n', lineStart - 1);
    line++;
  }
  if (lineStart === 0) {
    line++;
  }
  const generated = map.generatedPositionFor({
    line,
    column,
    source: map.sources[0],
  });
  if (generated.line === null || generated.column === null) {
    return undefined;
  }
  return { line: generated.line - 1, ch: generated.column };
}

export default function TransformOutput({
  transformResult,
  mode,
  transforming,
}: {
  transformResult: TransformResult | null;
  mode: string;
  transforming?: boolean;
}): React.ReactElement {
  // This ensures that we are rendering an empty editor as "placeholder" if no transform result is available yet.
  const result = transformResult ?? { result: '' };

  const posFromIndex = React.useCallback(
    (index: number) => positionFromIndex(index, transformResult?.map),
    [transformResult],
  );

  return (
    <div className={`output highlight${transforming === true ? ' loading' : ''}`}>
      {transforming === true && (
        <div className="parsing-indicator">
          <i className="fa fa-lg fa-spinner fa-pulse" />
        </div>
      )}
      {result.error !== undefined && result.error !== null ? (
        <Editor
          highlight={false}
          key="error"
          lineNumbers={false}
          readOnly={true}
          value={result.error.message}
        />
      ) : typeof result.result === 'string' ? (
        <Editor
          posFromIndex={posFromIndex}
          mode={mode}
          key="output"
          readOnly={true}
          value={result.result}
        />
      ) : (
        <JSONEditor className="container no-toolbar" value={safeStringify(result.result, 2)} />
      )}
    </div>
  );
}
