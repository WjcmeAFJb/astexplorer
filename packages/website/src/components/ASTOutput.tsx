import React from 'react';
import cx from '../utils/classnames';
import visualizations from './visualization';
import { publish } from '../utils/pubsub';
import { treeAdapterFromParseResult } from '../core/TreeAdapter';
import type { ParseResult } from '../types';

const { useState, useEffect, useMemo } = React;

function formatTime(time: number | null | undefined): string | undefined {
  if (time === null || time === undefined || time === 0) {
    return undefined;
  }
  if (time < 1000) {
    return `${time}ms`;
  }
  return `${(time / 1000).toFixed(2)}s`;
}

type ASTOutputProps = {
  parseResult?: ParseResult;
  position?: number;
  parsing?: boolean;
  cursorNodes?: unknown[];
};

export default function ASTOutput({
  parseResult,
  position,
  parsing,
  cursorNodes,
}: ASTOutputProps): React.ReactElement {
  const [selectedOutput, setSelectedOutput] = useState(0);
  const ast = parseResult?.ast;
  let output;

  // Compute source ranges for all cursor-matched nodes and publish them so the
  // source code editor (and JSON view) can draw persistent highlights.
  const cursorRanges = useMemo(() => {
    if (!cursorNodes || cursorNodes.length === 0 || !parseResult?.treeAdapter) return [];
    const adapter = treeAdapterFromParseResult(parseResult, {});
    const ranges: [number, number][] = [];
    const seen = new Set<string>();
    for (const node of cursorNodes) {
      const r = adapter.getRange(node);
      if (r && typeof r[0] === 'number' && typeof r[1] === 'number') {
        const key = `${r[0]}:${r[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          ranges.push([r[0], r[1]]);
        }
      }
    }
    return ranges;
  }, [cursorNodes, parseResult]);

  useEffect(() => {
    publish('CURSOR_CAPTURE_RANGES', { ranges: cursorRanges });
  }, [cursorRanges]);

  // Match nodes by range rather than identity: the cursor-captured nodes
  // come from a separate parse pass (the transformer may use a different
  // parser than the AST view), so object references don't align.
  const cursorRangeSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of cursorRanges) {
      set.add(`${r[0]}:${r[1]}`);
    }
    return set;
  }, [cursorRanges]);

  if (parseResult !== undefined && parseResult.error !== null && parseResult.error !== undefined) {
    output = (
      <div
        style={{
          padding: 20,
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
        }}
      >
        {parseResult.error.message}
      </div>
    );
  } else if (ast !== undefined && ast !== null && parseResult !== undefined) {
    output = (
      <ErrorBoundary>
        {React.createElement(visualizations[selectedOutput].component, {
          parseResult,
          position,
          cursorRanges: cursorRangeSet,
        })}
      </ErrorBoundary>
    );
  }

  const buttons = visualizations.map((entry, index) => (
    <button
      key={index}
      value={index}
      onClick={(event) => {
        const target = event.target;
        if (target instanceof HTMLButtonElement) {
          setSelectedOutput(Number(target.value));
        }
      }}
      className={cx({
        active: selectedOutput === index,
      })}
    >
      {entry.name}
    </button>
  ));

  return (
    <div className={cx('output', 'highlight', { loading: parsing })}>
      <div className="toolbar">
        {buttons}
        <span className="time">{formatTime(parseResult?.time)}</span>
      </div>
      {parsing === true && (
        <div className="parsing-indicator">
          <i className="fa fa-lg fa-spinner fa-pulse" />
        </div>
      )}
      {output}
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: 20 }}>
          An error was caught while rendering the AST. This usually is an issue with astexplorer
          itself. Have a look at the console for more information. Consider{' '}
          <a href="https://github.com/fkling/astexplorer/issues/new?template=bug_report.md">
            filing a bug report
          </a>
          , but <a href="https://github.com/fkling/astexplorer/issues/">check first</a> if one
          doesn&quot;t already exist. Thank you!
        </div>
      );
    }
    return this.props.children;
  }
}
