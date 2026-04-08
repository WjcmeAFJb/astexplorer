import * as monaco from 'monaco-editor';
import { subscribe, clear } from '../utils/pubsub';
import { ensureLanguageRegistered } from '../monacoLanguages';
import React from 'react';

type JSONEditorProps = {
  value?: string;
  className?: string;
};

export default class Editor extends React.Component<JSONEditorProps> {
  static displayName = 'JSONEditor';
  monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  container: HTMLElement | null = null;
  _subscriptions: Array<() => void> = [];

  componentDidUpdate(prevProps: JSONEditorProps) {
    if (
      this.monacoEditor &&
      this.props.value !== prevProps.value &&
      this.props.value !== this.monacoEditor.getValue()
    ) {
      const scrollTop = this.monacoEditor.getScrollTop();
      const scrollLeft = this.monacoEditor.getScrollLeft();
      this.monacoEditor.setValue(this.props.value ?? '');
      this.monacoEditor.setScrollPosition({ scrollTop, scrollLeft });
    }
  }

  shouldComponentUpdate(nextProps: JSONEditorProps) {
    return nextProps.value !== this.props.value;
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
