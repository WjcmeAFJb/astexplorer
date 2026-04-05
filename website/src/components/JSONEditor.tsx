import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/brace-fold';
import PropTypes from 'prop-types';
import {subscribe, clear} from '../utils/pubsub';
import React from 'react';

type JSONEditorProps = {
  value?: string;
  className?: string;
};

export default class Editor extends React.Component<JSONEditorProps> {
  static displayName = 'JSONEditor';
  codeMirror: CodeMirror.Editor | null = null;
  container: HTMLElement | null = null;
  _subscriptions: Array<() => void> = [];

  componentDidUpdate(prevProps: JSONEditorProps) {
    if (this.props.value !== prevProps.value && this.props.value !== this.codeMirror.getValue()) {
      let info = this.codeMirror.getScrollInfo();
      this.codeMirror.setValue(this.props.value);
      this.codeMirror.scrollTo(info.left, info.top);
    }
  }

  shouldComponentUpdate(nextProps: JSONEditorProps) {
    return nextProps.value !== this.props.value;
  }

  componentDidMount() {
        this._subscriptions = [];
    this.codeMirror = CodeMirror( // eslint-disable-line new-cap
      this.container,
      {
        value: this.props.value,
        mode: {name: 'javascript', json: true},
        readOnly: true,
        lineNumbers: true,
        foldGutter: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      },
    );

    this._subscriptions.push(
      subscribe('PANEL_RESIZE', () => {
        if (this.codeMirror) {
          this.codeMirror.refresh();
        }
      }),
    );
  }

  componentWillUnmount() {
    this._unbindHandlers();
    let container = this.container;
    container.children[0].remove();
    this.codeMirror = null;
  }

  _unbindHandlers() {
    clear(this._subscriptions);
  }

  render() {
    return (
      // @ts-expect-error — ref callback returns assignment value instead of void
      <div id="JSONEditor" className={this.props.className}
        ref={c => this.container = c}/>
    );
  }
}

Editor.propTypes = {
  value: PropTypes.string,
  className: PropTypes.string,
};
