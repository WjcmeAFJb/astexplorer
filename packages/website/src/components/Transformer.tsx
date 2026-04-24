import Editor from './Editor';
import JSCodeshiftEditor from './JSCodeshiftEditor';
import TreeGexEditor from './TreeGexEditor';
import { publish } from '../utils/pubsub';
import * as React from 'react';
import SplitPane from './SplitPane';
import TransformOutput from './TransformOutput';
import PrettierButton from './buttons/PrettierButton';
import type { Transformer as TransformerType, TransformResult } from '../types';

function resize() {
  publish('PANEL_RESIZE');
}

type TransformerProps = {
  transformer?: TransformerType;
  transformCode: string;
  onContentChange: (args: { value: string; cursor: number }) => void;
  /** Hover-driven capture offset for tree-gex; null when hover leaves. */
  onCursorActivity?: (cursor: number | null) => void;
  enableFormatting: boolean;
  keyMap: string;
  toggleFormatting: () => void;
  transformResult: TransformResult | null;
  transforming?: boolean;
  mode: string;
  hoverMode?: boolean;
  onToggleHover?: () => void;
};

function HoverToggle({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={`tg-hover-toggle${enabled ? ' on' : ''}`}
      onClick={onToggle}
      title="Toggle hover mode: highlight the tree-gex sub-expression and the nodes it would capture under the mouse."
    >
      {enabled ? 'Hover: on' : 'Hover: off'}
    </button>
  );
}

export default function Transformer(props: TransformerProps): React.ReactElement {
  const isTreeGex = props.transformer?.id.startsWith('tree-gex') === true;
  const editorProps: Record<string, unknown> = {
    highlight: false,
    value: props.transformCode,
    onContentChange: props.onContentChange,
    enableFormatting: props.enableFormatting,
    keyMap: props.keyMap,
  };
  if (isTreeGex) {
    editorProps.hoverMode = props.hoverMode === true;
    editorProps.onHoverOffset = props.onCursorActivity;
  }
  const plainEditor = React.createElement(
    props.transformer?.id === 'jscodeshift'
      ? JSCodeshiftEditor
      : isTreeGex
        ? TreeGexEditor
        : Editor,
    editorProps,
  );

  const formattingEditor = (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', display: 'flex' }}>
      <PrettierButton
        toggleFormatting={props.toggleFormatting}
        enableFormatting={props.enableFormatting}
      />
      {isTreeGex && props.onToggleHover && (
        <HoverToggle enabled={props.hoverMode === true} onToggle={props.onToggleHover} />
      )}
      {plainEditor}
    </div>
  );

  return (
    <SplitPane className="splitpane" onResize={resize}>
      {formattingEditor}
      <TransformOutput
        transformResult={props.transformResult}
        mode={props.mode}
        transforming={props.transforming}
      />
    </SplitPane>
  );
}
