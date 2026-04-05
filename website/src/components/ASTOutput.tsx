import PropTypes from 'prop-types';
import React from 'react';
import cx from '../utils/classnames';
import visualizations from './visualization';

const {useState} = React;

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
  parseResult?: { error?: { message: string }; time?: number; ast?: unknown; treeAdapter?: unknown };
  position?: number;
};

// oxlint-disable-next-line max-lines-per-function -- ASTOutput manages multiple visualization modes with tab switching
export default function ASTOutput({parseResult={}, position}: ASTOutputProps): React.ReactElement {
  const [selectedOutput, setSelectedOutput] = useState(0);
  const {ast} = parseResult;
  let output;

  if (parseResult.error !== undefined) {
    output =
      <div style={{
        padding: 20,
        whiteSpace: 'pre-wrap',
        fontFamily: 'monospace',
      }}>
        {parseResult.error.message}
      </div>;
  } else if (ast !== undefined && ast !== null) {
    output = (
      <ErrorBoundary>
        {
          React.createElement(
            visualizations[selectedOutput],
            {parseResult, position},
          )
        }
      </ErrorBoundary>
    )
  }

  const buttons = visualizations.map(
    (cls, index) =>
      <button
        key={index}
        value={index}
        onClick={event => {
          const target = event.target;
          if (target instanceof HTMLButtonElement) {
            setSelectedOutput(Number(target.value));
          }
        }}
        className={cx({
          active: selectedOutput === index,
        })}>
        {cls.name}
      </button>,
  );

  return (
    <div className="output highlight">
      <div className="toolbar">
        {buttons}
        <span className="time">
          {formatTime(parseResult.time)}
        </span>
      </div>
    {output}
    </div>
  );
}

ASTOutput.propTypes = {
  parseResult: PropTypes.object,
  position: PropTypes.number,
};

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
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
        <div style={{padding: 20}}>
					An error was caught while rendering the AST. This usually is an issue with
          astexplorer itself. Have a look at the console for more information.
          Consider <a href="https://github.com/fkling/astexplorer/issues/new?template=bug_report.md">filing a bug report</a>, but <a href="https://github.com/fkling/astexplorer/issues/">check first</a> if one doesn&quot;t already exist. Thank you!
				</div>
			);
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
