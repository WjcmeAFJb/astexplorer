import * as monaco from 'monaco-editor';
import { subscribe, clear } from '../utils/pubsub';
import { ensureLanguageRegistered } from '../monacoLanguages';
import React from 'react';

export type JSONHighlight = { start: number; end: number };

type JSONEditorProps = {
  value?: string;
  className?: string;
  highlights?: JSONHighlight[];
};

export default class Editor extends React.Component<JSONEditorProps> {
  static displayName = 'JSONEditor';
  monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  container: HTMLElement | null = null;
  _subscriptions: Array<() => void> = [];
  _highlightDecorationIds: string[] = [];

  componentDidUpdate(prevProps: JSONEditorProps) {
    let valueChanged = false;
    if (
      this.monacoEditor &&
      this.props.value !== prevProps.value &&
      this.props.value !== this.monacoEditor.getValue()
    ) {
      const scrollTop = this.monacoEditor.getScrollTop();
      const scrollLeft = this.monacoEditor.getScrollLeft();
      this.monacoEditor.setValue(this.props.value ?? '');
      this.monacoEditor.setScrollPosition({ scrollTop, scrollLeft });
      // setValue wipes decorations from the old model; re-register.
      this._highlightDecorationIds = [];
      valueChanged = true;
    }
    if (valueChanged || this.props.highlights !== prevProps.highlights) {
      this._applyHighlights();
    }
  }

  shouldComponentUpdate(nextProps: JSONEditorProps) {
    return nextProps.value !== this.props.value || nextProps.highlights !== this.props.highlights;
  }

  _applyHighlights() {
    const editor = this.monacoEditor;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;
    const highlights = this.props.highlights ?? [];
    const decorations: monaco.editor.IModelDeltaDecoration[] = [];
    for (const h of highlights) {
      const startPos = model.getPositionAt(h.start);
      const endPos = model.getPositionAt(h.end);
      if (!startPos || !endPos) continue;
      decorations.push({
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column,
        ),
        options: {
          className: 'cursor-matched',
          overviewRuler: {
            color: 'rgba(255, 165, 0, 0.8)',
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      });
    }
    this._highlightDecorationIds = editor.deltaDecorations(
      this._highlightDecorationIds,
      decorations,
    );
  }

  componentDidMount() {
    this._subscriptions = [];
    if (!this.container) {
      return;
    }
    this.monacoEditor = monaco.editor.create(this.container, {
      value: this.props.value,
      readOnly: true,
      lineNumbers: 'on',
      folding: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 12,
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        useShadows: false,
      },
    });

    void ensureLanguageRegistered('json').then(() => {
      const model = this.monacoEditor?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, 'json');
      }
      this._applyHighlights();
    });

    this._subscriptions.push(
      subscribe('PANEL_RESIZE', () => {
        if (this.monacoEditor) {
          this.monacoEditor.layout();
        }
      }),
    );
  }

  componentWillUnmount() {
    this._unbindHandlers();
    this._highlightDecorationIds = [];
    if (this.monacoEditor) {
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }
  }

  _unbindHandlers() {
    clear(this._subscriptions);
  }

  render() {
    return (
      <div
        id="JSONEditor"
        className={this.props.className}
        ref={(c) => {
          this.container = c;
        }}
      />
    );
  }
}
