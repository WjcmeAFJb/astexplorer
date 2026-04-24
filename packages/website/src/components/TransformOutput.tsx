/*eslint no-new-func: 0*/
import Editor from './Editor';
import JSONEditor from './JSONEditor';
import * as React from 'react';
import { publish } from '../utils/pubsub';
import type { TransformResult, SourceMapConsumer } from '../types';

const OUTPUT_CAPTURE_TOPIC = 'CURSOR_CAPTURE_OUTPUT_RANGES';

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

  // Extract ranges from cursorOutputNodes. These nodes came from a parse of
  // the transformer's output, so their `start`/`end` are already offsets
  // into the output string — no tree-adapter indirection needed.
  const outputRanges = React.useMemo(() => {
    const nodes = transformResult?.cursorOutputNodes ?? [];
    const ranges: [number, number][] = [];
    const seen = new Set<string>();
    for (const n of nodes) {
      if (!n || typeof n !== 'object') continue;
      const rec = n as { start?: unknown; end?: unknown; range?: unknown };
      let start: number | undefined;
      let end: number | undefined;
      if (typeof rec.start === 'number' && typeof rec.end === 'number') {
        start = rec.start;
        end = rec.end;
      } else if (
        Array.isArray(rec.range) &&
        typeof rec.range[0] === 'number' &&
        typeof rec.range[1] === 'number'
      ) {
        start = rec.range[0];
        end = rec.range[1];
      }
      if (start === undefined || end === undefined) continue;
      const key = `${start}:${end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      ranges.push([start, end]);
    }
    return ranges;
  }, [transformResult]);

  React.useEffect(() => {
    publish(OUTPUT_CAPTURE_TOPIC, { ranges: outputRanges });
  }, [outputRanges]);

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
          captureTopic={OUTPUT_CAPTURE_TOPIC}
        />
      ) : (
        <JSONEditor className="container no-toolbar" value={safeStringify(result.result, 2)} />
      )}
    </div>
  );
}
