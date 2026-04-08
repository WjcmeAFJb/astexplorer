import * as monaco from 'monaco-editor';
import { subscribe, clear } from '../utils/pubsub';
import React from 'react';
import { getMonacoLanguage, ensureLanguageRegistered } from '../monacoLanguages';

const defaultPrettierOptions: Record<string, unknown> = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: false,
  trailingComma: 'none',
  bracketSpacing: true,
  jsxBracketSameLine: false,
  parser: 'babel',
};

export type EditorProps = {
  value?: string;
  highlight?: boolean;
  lineNumbers?: boolean;
  readOnly?: boolean;
  onContentChange?: (args: { value: string; cursor: number }) => void;
  onActivity?: (cursor: number) => void;
  posFromIndex?: (index: number) => { line: number; ch: number } | undefined;
  error?: { message: string; loc?: { line: number }; lineNumber?: number; line?: number };
  mode?: string;
  enableFormatting?: boolean;
  keyMap?: string;
};

export default class Editor extends React.Component<EditorProps, { value: string }> {
  static displayName = 'Editor';
  static defaultProps: Partial<EditorProps>;
  monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
  container: HTMLElement | null = null;
  _subscriptions: Array<() => void> = [];
  _updateTimer: ReturnType<typeof setTimeout> | undefined;
  _activityTimer: ReturnType<typeof setTimeout> | undefined;
  _markerRange: [number, number] | null = null;
  _decorationIds: string[] = [];
  _errorDecorationIds: string[] = [];
  _ignoreChange = false;

  constructor(props: EditorProps) {
    super(props);
    this.state = {
      value: props.value ?? '',
    };
  }

  static getDerivedStateFromProps(props: EditorProps, state: { value: string }) {
    if (props.value !== state.value) {
      return { value: props.value };
    }
    return null;
  }

  componentDidUpdate(prevProps: EditorProps, prevState: { value: string }) {
    if (this.props.value !== prevState.value && this.monacoEditor) {
      // Only call setValue when the model content actually differs.
      // When the user types, the model already has the new value; calling
      // setValue again would reset undo history and cursor position.
      const model = this.monacoEditor.getModel();
      if (model && model.getValue() !== (this.props.value ?? '')) {
        this._ignoreChange = true;
        this.monacoEditor.setValue(this.props.value ?? '');
        this._ignoreChange = false;
      }
    }
    if (this.props.mode !== prevProps.mode && this.monacoEditor) {
      const newLangId = getMonacoLanguage(this.props.mode);
      const editor = this.monacoEditor;
      void ensureLanguageRegistered(newLangId).then(() => {
        const model = editor.getModel();
        if (model) {
          monaco.editor.setModelLanguage(model, newLangId);
        }
      });
    }
    if (this.props.keyMap !== prevProps.keyMap) {
      this._applyKeyMap();
    }
    this._setError(this.props.error);
  }

  shouldComponentUpdate(nextProps: EditorProps) {
    return (
      nextProps.value !== this.state.value ||
      nextProps.mode !== this.props.mode ||
      nextProps.keyMap !== this.props.keyMap ||
      nextProps.error !== this.props.error
    );
  }

  getValue(): string | undefined {
    return this.monacoEditor ? this.monacoEditor.getValue() : undefined;
  }

  _getErrorLine(error: EditorProps['error']): number | undefined {
    if (!error) return undefined;
    return error.loc ? error.loc.line : (error.lineNumber ?? error.line);
  }

  _setError(error?: EditorProps['error']) {
    if (!this.monacoEditor) return;

    // Clear old error decorations
    this._errorDecorationIds = this.monacoEditor.deltaDecorations(this._errorDecorationIds, []);

    if (error) {
      const lineNumber = this._getErrorLine(error);
      if (lineNumber !== undefined && lineNumber !== 0) {
        this._errorDecorationIds = this.monacoEditor.deltaDecorations(
          [],
          [
            {
              range: new monaco.Range(lineNumber, 1, lineNumber, 1),
              options: {
                isWholeLine: true,
                className: 'errorMarker',
              },
            },
          ],
        );
      }
    }
  }

  _posFromIndex(model: monaco.editor.ITextModel, index: number): { line: number; ch: number } {
    if (this.props.posFromIndex) {
      const pos = this.props.posFromIndex(index);
      if (pos) return pos;
    }
    const position = model.getPositionAt(index);
    return { line: position.lineNumber - 1, ch: position.column - 1 };
  }

  _applyKeyMap() {
    // Monaco doesn't support vim/emacs natively. We just accept the keyMap prop
    // for API compatibility but do nothing with it - Monaco uses its own keybinding system.
  }

  componentDidMount() {
    this._subscriptions = [];
    if (!this.container) return;

    const langId = getMonacoLanguage(this.props.mode);
    this.monacoEditor = monaco.editor.create(this.container, {
      value: this.state.value,
      lineNumbers: this.props.lineNumbers !== false ? 'on' : 'off',
      readOnly: this.props.readOnly === true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      fontSize: 13,
      folding: true,
      wordWrap: 'off',
      renderWhitespace: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      scrollbar: {
        useShadows: false,
      },
    });

    // Register language then apply it. The editor starts with no language
    // (plaintext) and gets syntax highlighting once the contribution loads.
    void ensureLanguageRegistered(langId).then(() => {
      const model = this.monacoEditor?.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, langId);
      }
    });

    this.monacoEditor.onDidBlurEditorWidget(() => {
      if (this.props.enableFormatting !== true) return;

      const editor = this.monacoEditor;
      if (!editor) return;

      void Promise.all([import('prettier/standalone'), import('prettier/parser-babel')]).then(
        ([prettierMod, babelMod]) => {
          const prettier = prettierMod.default ?? prettierMod;
          const babel = babelMod.default ?? babelMod;
          const currValue = editor.getValue();
          const domNode = editor.getDomNode();
          const maxLineLength = domNode ? domNode.clientWidth : 80;
          const options = Object.assign({}, defaultPrettierOptions, {
            printWidth: maxLineLength,
            plugins: [babel],
          });
          const result = prettier.format(currValue, options);
          // Prettier v2 returns string, v3 returns Promise<string>
          if (typeof result === 'string') {
            editor.setValue(result);
          } else {
            void (result as Promise<string>).then((formatted) => editor.setValue(formatted));
          }
        },
      );
    });

    this.monacoEditor.onDidChangeModelContent(() => {
      if (this._ignoreChange) return;
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(() => this._onContentChange(), 200);
    });

    this.monacoEditor.onDidChangeCursorPosition(() => {
      clearTimeout(this._activityTimer);
      this._activityTimer = setTimeout(() => this._onActivity(), 100);
    });

    this._subscriptions.push(
      subscribe('PANEL_RESIZE', () => {
        if (this.monacoEditor) {
          this.monacoEditor.layout();
        }
      }),
    );

    if (this.props.highlight === true) {
      this._markerRange = null;
      this._decorationIds = [];
      this._subscriptions.push(
        subscribe('HIGHLIGHT', (data: unknown) => {
          const { range } = (data ?? {}) as { range?: [number, number] };
          if (!range) {
            return;
          }
          const editor = this.monacoEditor;
          if (!editor) return;
          const model = editor.getModel();
          if (!model) return;
          this._markerRange = range;
          const startPos = model.getPositionAt(range[0]);
          const endPos = model.getPositionAt(range[1]);
          if (!startPos || !endPos) {
            this._markerRange = null;
            this._decorationIds = editor.deltaDecorations(this._decorationIds, []);
            return;
          }
          this._decorationIds = editor.deltaDecorations(this._decorationIds, [
            {
              range: new monaco.Range(
                startPos.lineNumber,
                startPos.column,
                endPos.lineNumber,
                endPos.column,
              ),
              options: {
                className: 'marked',
              },
            },
          ]);
        }),

        subscribe('CLEAR_HIGHLIGHT', (data: unknown) => {
          const { range } = (data ?? {}) as { range?: [number, number] };
          if (
            !range ||
            (this._markerRange &&
              range[0] === this._markerRange[0] &&
              range[1] === this._markerRange[1])
          ) {
            this._markerRange = null;
            if (this.monacoEditor) {
              this._decorationIds = this.monacoEditor.deltaDecorations(this._decorationIds, []);
            }
          }
        }),
      );
    }

    if (this.props.error) {
      this._setError(this.props.error);
    }
  }

  componentWillUnmount() {
    clearTimeout(this._updateTimer);
    clearTimeout(this._activityTimer);
    this._unbindHandlers();
    this._markerRange = null;
    this._decorationIds = [];
    this._errorDecorationIds = [];
    if (this.monacoEditor) {
      this.monacoEditor.dispose();
      this.monacoEditor = null;
    }
  }

  _unbindHandlers() {
    clear(this._subscriptions);
  }

  _onContentChange() {
    if (!this.monacoEditor) return;
    const model = this.monacoEditor.getModel();
    if (!model) return;
    const value = model.getValue();
    const position = this.monacoEditor.getPosition();
    const cursor = position ? model.getOffsetAt(position) : 0;
    const args = { value, cursor };
    this.setState({ value: args.value }, () => {
      if (this.props.onContentChange) this.props.onContentChange(args);
    });
  }

  _onActivity() {
    if (!this.props.onActivity) return;
    if (!this.monacoEditor) return;
    const model = this.monacoEditor.getModel();
    const position = this.monacoEditor.getPosition();
    if (!model || !position) return;
    this.props.onActivity(model.getOffsetAt(position));
  }

  render() {
    return (
      <div
        className="editor"
        ref={(c) => {
          this.container = c;
        }}
      />
    );
  }
}

Editor.defaultProps = {
  value: '',
  highlight: true,
  lineNumbers: true,
  readOnly: false,
  mode: 'javascript',
  keyMap: 'default',
  onContentChange: () => {},
  onActivity: () => {},
};
