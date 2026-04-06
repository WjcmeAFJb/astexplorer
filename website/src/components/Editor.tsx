import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import {subscribe, clear} from '../utils/pubsub';
import React from 'react';
import {ensureCMMode} from '../codemirrorModes';

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
  onContentChange?: (args: {value: string, cursor: number}) => void;
  onActivity?: (cursor: number) => void;
  posFromIndex?: (index: number) => {line: number, ch: number} | undefined;
  error?: {message: string, loc?: {line: number}, lineNumber?: number, line?: number};
  mode?: string;
  enableFormatting?: boolean;
  keyMap?: string;
};

export default class Editor extends React.Component<EditorProps, {value: string}> {
  static displayName = 'Editor';
  static defaultProps: Partial<EditorProps>;
  codeMirror: CodeMirror.Editor | null = null;
  container: HTMLElement | null = null;
  _CMHandlers: Array<() => void> = [];
  _subscriptions: Array<() => void> = [];
  _updateTimer: ReturnType<typeof setTimeout> | undefined;
  _markerRange: [number, number] | null = null;
  _mark: CodeMirror.TextMarker | null = null;

    constructor(props: EditorProps) {
    super(props);
    this.state = {
      value: props.value ?? '',
    };
  }

  static getDerivedStateFromProps(props: EditorProps, state: {value: string}) {
    if (props.value !== state.value) {
      return { value: props.value };
    }
    return null;
  }

  componentDidUpdate(prevProps: EditorProps, prevState: {value: string}) {
    if (this.props.value !== prevState.value && this.codeMirror) {
      this.codeMirror.setValue(this.props.value ?? '');
    }
    if (this.props.mode !== prevProps.mode) {
        void ensureCMMode(this.props.mode).then(() => {
        this.codeMirror?.setOption('mode', this.props.mode);
        return null;
      });
    }
    if (this.props.keyMap !== prevProps.keyMap && this.codeMirror) {
      this.codeMirror.setOption('keyMap', this.props.keyMap);
    }
    this._setError(this.props.error);
  }

  shouldComponentUpdate(nextProps: EditorProps) {
    return nextProps.value !== this.state.value ||
      nextProps.mode !== this.props.mode ||
      nextProps.keyMap !== this.props.keyMap ||
      nextProps.error !== this.props.error;
  }

  getValue(): string | undefined {
    return this.codeMirror ? this.codeMirror.getValue() : undefined;
  }

    _getErrorLine(error: EditorProps['error']): number | undefined {
    if (!error) return undefined;
    return error.loc ? error.loc.line : (error.lineNumber ?? error.line);
  }

    _setError(error?: EditorProps['error']) {
    if (this.codeMirror) {
      let oldError = this.props.error;
      if (oldError) {
        let lineNumber = this._getErrorLine(oldError);
        if (lineNumber !== undefined && lineNumber !== 0) {
          this.codeMirror.removeLineClass(lineNumber-1, 'text', 'errorMarker');
        }
      }

      if (error) {
        let lineNumber = this._getErrorLine(error);
        if (lineNumber !== undefined && lineNumber !== 0) {
          this.codeMirror.addLineClass(lineNumber-1, 'text', 'errorMarker');
        }
      }
    }
  }

    _posFromIndex(doc: CodeMirror.Doc, index: number): {line: number, ch: number} {
    if (this.props.posFromIndex) {
      return this.props.posFromIndex(index) ?? doc.posFromIndex(index) as {line: number, ch: number};
    }
    return doc.posFromIndex(index) as {line: number, ch: number};
  }

  componentDidMount() {
        this._CMHandlers = [];
        this._subscriptions = [];
    if (!this.container) return;
    this.codeMirror = CodeMirror( // eslint-disable-line new-cap
      this.container,
      {
        keyMap: this.props.keyMap,
        value: this.state.value,
        lineNumbers: this.props.lineNumbers,
        readOnly: this.props.readOnly,
      },
    );
    // Load the CodeMirror mode asynchronously, then apply it
    void ensureCMMode(this.props.mode).then(() => {
      this.codeMirror?.setOption('mode', this.props.mode);
      return null;
    });

    this._bindCMHandler('blur', () => {
      if (this.props.enableFormatting !== true) return;

      const cm = this.codeMirror;
      if (cm === null || cm === undefined) return;

      require(['prettier/standalone', 'prettier/parser-babel'], (prettier: {format: (code: string, options: Record<string, unknown>) => string}, babel: unknown) => {
        const currValue = cm.getDoc().getValue();
        const cmEl = cm.getWrapperElement();
        const maxLineLength = cmEl.clientWidth;
        const options = Object.assign({},
          defaultPrettierOptions,
          {
            printWidth: maxLineLength,
            plugins: [babel],
          });
        cm.getDoc().setValue(prettier.format(currValue, options));
      });
    });

    this._bindCMHandler('changes', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(() => this._onContentChange(), 200);
    });
    this._bindCMHandler('cursorActivity', () => {
      clearTimeout(this._updateTimer);
      this._updateTimer = setTimeout(() => this._onActivity(), 100);
    });

    this._subscriptions.push(
      subscribe('PANEL_RESIZE', () => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      }),
    );

    if (this.props.highlight === true) {
            this._markerRange = null;
            this._mark = null;
      this._subscriptions.push(
        subscribe('HIGHLIGHT', (data: unknown) => {
          const {range} = (data ?? {}) as {range?: [number, number]};
          if (!range) {
            return;
          }
          const cm = this.codeMirror;
          if (!cm) return;
          let doc = cm.getDoc();
          this._markerRange = range;
          // We only want one mark at a time.
          if (this._mark) {
            this._mark.clear();
          }
          let [start, end] = range.map((index: number) => this._posFromIndex(doc, index));
          if (start === undefined || start === null || end === undefined || end === null) {
            this._markerRange = null;
            this._mark = null;
            return;
          }
          this._mark = cm.markText(
            start,
            end,
            {className: 'marked'},
          );
        }),

        subscribe('CLEAR_HIGHLIGHT', (data: unknown) => {
          const {range} = (data ?? {}) as {range?: [number, number]};
          if (!range ||
            this._markerRange &&
            range[0] === this._markerRange[0] &&
            range[1] === this._markerRange[1]
          ) {
            this._markerRange = null;
            if (this._mark) {
              this._mark.clear();
              this._mark = null;
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
    this._unbindHandlers();
    this._markerRange = null;
    this._mark = null;
    let container = this.container;
    if (container) {
      container.children[0].remove();
    }
    this.codeMirror = null;
  }

    _bindCMHandler<T extends keyof CodeMirror.EditorEventMap>(event: T, handler: CodeMirror.EditorEventMap[T]) {
    this.codeMirror?.on(event, handler);
    this._CMHandlers.push(() => this.codeMirror?.off(event, handler));
  }

  _unbindHandlers() {
    for (const teardown of this._CMHandlers) {
      teardown();
    }
    clear(this._subscriptions);
  }

  _onContentChange() {
    if (!this.codeMirror) return;
    const doc = this.codeMirror.getDoc();
    const args = {
      value: doc.getValue(),
      cursor: doc.indexFromPos(doc.getCursor()),
    };
    this.setState(
      {value: args.value},
      () => { if (this.props.onContentChange) this.props.onContentChange(args); },
    );
  }

  _onActivity() {
    if (!this.props.onActivity) return;
    if (!this.codeMirror) return;
    this.props.onActivity(
      this.codeMirror.getDoc().indexFromPos(this.codeMirror.getCursor()),
    );
  }

  render() {
    return (
      <div className="editor"
        ref={c => { this.container = c; }}/>
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
