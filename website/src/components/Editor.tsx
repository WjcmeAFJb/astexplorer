import CodeMirror from 'codemirror';
import 'codemirror/keymap/vim';
import 'codemirror/keymap/emacs';
import 'codemirror/keymap/sublime';
import PropTypes from 'prop-types';
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
  posFromIndex?: (index: number) => {line: number, ch: number};
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
  _CMHandlers: Array<string | ((...args: unknown[]) => void)> = [];
  _subscriptions: Array<() => void> = [];
  _updateTimer: ReturnType<typeof setTimeout> | undefined;
  _markerRange: [number, number] | null = null;
  _mark: CodeMirror.TextMarker | null = null;

    constructor(props: EditorProps) {
    super(props);
    this.state = {
      value: props.value,
    };
  }

  static getDerivedStateFromProps(props: EditorProps, state: {value: string}) {
    if (props.value !== state.value) {
      return { value: props.value };
    }
    return null;
  }

  componentDidUpdate(prevProps: EditorProps, prevState: {value: string}) {
    if (this.props.value !== prevState.value) {
      this.codeMirror.setValue(this.props.value);
    }
    if (this.props.mode !== prevProps.mode) {
      // oxlint-disable-next-line promise/always-return -- side-effect only: applying CodeMirror mode after async load
      ensureCMMode(this.props.mode).then(() => {
        this.codeMirror?.setOption('mode', this.props.mode);
      });
    }
    if (this.props.keyMap !== prevProps.keyMap) {
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
    return this.codeMirror && this.codeMirror.getValue();
  }

    _getErrorLine(error: EditorProps['error']): number | undefined {
    return error.loc ? error.loc.line : (error.lineNumber ?? error.line);
  }

    _setError(error?: EditorProps['error']) {
    if (this.codeMirror) {
      let oldError = this.props.error;
      if (oldError) {
        let lineNumber = this._getErrorLine(oldError);
        if (lineNumber) {
          this.codeMirror.removeLineClass(lineNumber-1, 'text', 'errorMarker');
        }
      }

      if (error) {
        let lineNumber = this._getErrorLine(error);
        if (lineNumber) {
          this.codeMirror.addLineClass(lineNumber-1, 'text', 'errorMarker');
        }
      }
    }
  }

    _posFromIndex(doc: CodeMirror.Doc, index: number): {line: number, ch: number} {
    return ((this.props.posFromIndex ? this.props : doc).posFromIndex(index) as {line: number, ch: number});
  }

  // oxlint-disable-next-line max-lines-per-function -- componentDidMount sets up CodeMirror instance with multiple event handlers
  componentDidMount() {
        this._CMHandlers = [];
        this._subscriptions = [];
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
    // oxlint-disable-next-line promise/always-return -- side-effect only: applying CodeMirror mode after async load
    ensureCMMode(this.props.mode).then(() => {
      this.codeMirror?.setOption('mode', this.props.mode);
    });

    this._bindCMHandler('blur', (instance: any) => {
      if (!this.props.enableFormatting) return;

      require(['prettier/standalone', 'prettier/parser-babel'], (prettier: {format: (code: string, options: Record<string, unknown>) => string}, babel: unknown) => {
        const currValue = instance.doc.getValue();
        const options = Object.assign({},
          defaultPrettierOptions,
          {
            printWidth: instance.display.maxLineLength,
            plugins: [babel],
          });
        instance.doc.setValue(prettier.format(currValue, options));
      });
    });

    this._bindCMHandler('changes', () => {
      clearTimeout(this._updateTimer);
      // oxlint-disable-next-line typescript-eslint(no-unsafe-argument) -- .bind() returns any; TS limitation
      this._updateTimer = setTimeout(this._onContentChange.bind(this), 200);
    });
    this._bindCMHandler('cursorActivity', () => {
      clearTimeout(this._updateTimer);
      // oxlint-disable-next-line typescript-eslint(no-unsafe-argument) -- .bind() returns any; TS limitation
      this._updateTimer = setTimeout(this._onActivity.bind(this), 100);
    });

    this._subscriptions.push(
      subscribe('PANEL_RESIZE', () => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      }),
    );

    if (this.props.highlight) {
            this._markerRange = null;
            this._mark = null;
      this._subscriptions.push(
        subscribe('HIGHLIGHT', ({range}: {range?: [number, number]}) => {
          if (!range) {
            return;
          }
          let doc = this.codeMirror.getDoc();
          this._markerRange = range;
          // We only want one mark at a time.
          if (this._mark) {
            this._mark.clear();
          }
          let [start, end] = range.map((index: number) => this._posFromIndex(doc, index));
          if (!start || !end) {
            this._markerRange = this._mark = null;
            return;
          }
          this._mark = this.codeMirror.markText(
            start,
            end,
            {className: 'marked'},
          );
        }),

        subscribe('CLEAR_HIGHLIGHT', ({range}: {range?: [number, number]}={}) => {
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
    container.children[0].remove();
    this.codeMirror = null;
  }

    _bindCMHandler(event: string, handler: (...args: unknown[]) => void) {
    this._CMHandlers.push(event, handler);
    // @ts-expect-error — CodeMirror.on overloads don't accept generic string event names
    this.codeMirror.on(event, handler);
  }

  _unbindHandlers() {
    const cmHandlers = this._CMHandlers;
    for (let i = 0; i < cmHandlers.length; i += 2) {
      // @ts-expect-error — CodeMirror.off overloads don't accept generic string event names
      this.codeMirror.off(cmHandlers[i], cmHandlers[i+1]);
    }
    clear(this._subscriptions);
  }

  _onContentChange() {
    const doc = this.codeMirror.getDoc();
    const args = {
      value: doc.getValue(),
      cursor: doc.indexFromPos(doc.getCursor()),
    };
    this.setState(
      {value: args.value},
      () => this.props.onContentChange(args),
    );
  }

  _onActivity() {
    this.props.onActivity(
      this.codeMirror.getDoc().indexFromPos(this.codeMirror.getCursor()),
    );
  }

  render() {
    return (
      // @ts-expect-error — ref callback returns assignment value (element) instead of void
      <div className="editor"
        ref={c => this.container = c}/>
    );
  }
}

Editor.propTypes = {
  value: PropTypes.string,
  highlight: PropTypes.bool,
  lineNumbers: PropTypes.bool,
  readOnly: PropTypes.bool,
  onContentChange: PropTypes.func,
  onActivity: PropTypes.func,
  posFromIndex: PropTypes.func,
  error: PropTypes.object,
  mode: PropTypes.string,
  enableFormatting: PropTypes.bool,
  keyMap: PropTypes.string,
};

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
