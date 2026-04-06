import Editor from './Editor';
import JSCodeshiftEditor from './JSCodeshiftEditor';
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
  enableFormatting: boolean;
  keyMap: string;
  toggleFormatting: () => void;
  transformResult: TransformResult | null;
  mode: string;
};

export default function Transformer(props: TransformerProps): React.ReactElement {
  const plainEditor = React.createElement(
    props.transformer?.id === 'jscodeshift' ? JSCodeshiftEditor : Editor,
    {
      highlight: false,
      value: props.transformCode,
      onContentChange: props.onContentChange,
      enableFormatting: props.enableFormatting,
      keyMap: props.keyMap,
    },
  );

  const formattingEditor = (
    <div style={{ flex: 1, minHeight: 0, minWidth: 0, position: 'relative', display: 'flex' }}>
      <PrettierButton
        toggleFormatting={props.toggleFormatting}
        enableFormatting={props.enableFormatting}
      />
      {plainEditor}
    </div>
  );

  return (
    <SplitPane className="splitpane" onResize={resize}>
      {formattingEditor}
      <TransformOutput transformResult={props.transformResult} mode={props.mode} />
    </SplitPane>
  );
}
