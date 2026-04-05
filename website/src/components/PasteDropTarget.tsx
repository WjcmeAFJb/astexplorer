// oxlint-disable typescript-eslint/no-unsafe-type-assertion, typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import PropTypes from 'prop-types';
import React from 'react';
import { categories } from 'astexplorer-parsers';

function importEscodegen(): Promise<{generate: (ast: unknown, options: unknown) => string}> {
  return new Promise(resolve => { require(['escodegen'], resolve); });
}

const acceptedFileTypes = new Map([
  ['application/json', 'JSON'],
  ['text/plain', 'TEXT'],
]);

for (const { id, mimeTypes } of categories) {
  for (const mimeType of mimeTypes) {
    acceptedFileTypes.set(mimeType, id);
  }
}

type PasteDropTargetOwnProps = {
  onText?: (type: string, event: Event, code: string, categoryId?: string) => void;
  onError?: (...args: unknown[]) => void;
  children?: React.ReactNode;
};

type PasteDropTargetProps = PasteDropTargetOwnProps & Record<string, unknown>;

export default class PasteDropTarget extends React.Component<PasteDropTargetProps, {dragging: boolean}> {
  static displayName = 'PasteDropTarget';
  _listeners: Array<() => void> | null = [];
  // oxlint-disable-next-line unicorn/no-null -- DOM ref initial state: null is the standard for "not yet mounted"
  container: HTMLElement | null = null;

    constructor(props: PasteDropTargetProps) {
    super(props);
    this.state = {
      dragging: false,
    };
  }

    _onASTError(type: string, event: Event, ex: Error) {
    this.props.onError(
      type,
      event,
      `Cannot process pasted AST: ${ex.message}`,
    );
    throw ex;
  }

  // oxlint-disable-next-line max-lines-per-function -- componentDidMount binds multiple DOM event listeners; splitting would scatter related logic
  componentDidMount() {
        this._listeners = [];
    let target = this.container;

    // Handle pastes
    this._bindListener(document, 'paste', (event: ClipboardEvent) => {
      if (!event.clipboardData) {
        // No browser support? :(
        return;
      }
      let cbdata = event.clipboardData;
      // Plain text
      // @ts-expect-error — operator precedence: !indexOf > -1 compares boolean > number; existing code behavior
      if (!cbdata.types.indexOf || !cbdata.types.indexOf('text/plain') > -1) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this._jsonToCode(cbdata.getData('text/plain')).then(
        code => this.props.onText('paste', event, code),
        (ex: Error) => {
          if ((event.target as Element).nodeName !== 'TEXTAREA') {
            this._onASTError('paste', event, ex);
          }
        },
      );
    }, true);

        let timer: ReturnType<typeof setTimeout> | undefined;

    // Handle file drops
    this._bindListener(target, 'dragenter', (event: DragEvent) => {
      clearTimeout(timer);
      event.preventDefault();
      this.setState({dragging: true});
    }, true);

    this._bindListener(target, 'dragover', (event: DragEvent) => {
      clearTimeout(timer);
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }, true);

    this._bindListener(target, 'drop', (event: DragEvent) => {
      this.setState({dragging: false});
      let file = event.dataTransfer.files[0];
      let categoryId = acceptedFileTypes.get(file.type);
      if (!categoryId || !this.props.onText) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      let reader = new FileReader();
      reader.addEventListener('load', readerEvent => {
        let text = readerEvent.target.result;
        if (categoryId === 'JSON' || categoryId === 'TEXT') {
          // @ts-expect-error — text is reassigned from string|ArrayBuffer to Promise; resolved via Promise.resolve below
          text = this._jsonToCode(text).then(
            codeText => {
              categoryId = 'javascript';
              return codeText;
            },
            (ex: Error) => {
              if (categoryId === 'JSON') {
                this._onASTError('drop', readerEvent, ex);
              } else {
                categoryId = undefined;
                return text;
              }
            },
          );
        }
        // oxlint-disable-next-line promise/always-return -- side-effect only: dispatching drop text to parent
        Promise.resolve(text).then((resolvedText: string) => {
          this.props.onText('drop', readerEvent, resolvedText, categoryId);
        });
      });
      // oxlint-disable-next-line unicorn/prefer-blob-reading-methods -- FileReader.onload callback uses readerEvent arg; refactoring to file.text() would lose it
      reader.readAsText(file);
    }, true);

    this._bindListener(target, 'dragleave', () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.setState({dragging: false}), 50);
    }, true);
  }

  componentWillUnmount() {
    for (const removeListener of this._listeners) {
      removeListener();
    }
    // oxlint-disable-next-line unicorn/no-null -- cleanup: releasing listener array reference on unmount
    this._listeners = null;
  }

    _jsonToCode(json: string): Promise<string> {
    let ast;
    try {
      ast = (JSON.parse(json) as unknown);
    }
    catch {
      return Promise.resolve(json);
    }
    return importEscodegen().then((escodegen) => {
      return escodegen.generate(ast, {format: {indent: {style: '  '}}});
    });
  }

    _bindListener(elem: EventTarget, event: string, listener: (event: Event) => void, capture?: boolean) {
    for (const e of event.split(/\s+/)) {
      elem.addEventListener(e, listener, capture);
      this._listeners.push(
        () => elem.removeEventListener(e, listener, capture),
      );
    }
  }

  render() {
    let {children, onText: _onText, ...props} = this.props;
    const dropindicator = this.state.dragging ?
      <div className="dropIndicator">
        <div>Drop the code or (JSON-encoded) AST file here</div>
      </div> :
      // oxlint-disable-next-line unicorn/no-null -- React conditional rendering: null is idiomatic for rendering nothing
      null;

    return (
      <div
        // @ts-expect-error — ref callback returns assignment value instead of void
        ref={c => this.container = c}
        {...props}>
        {dropindicator}
        {children}
      </div>
    );
  }
}

PasteDropTarget.propTypes = {
  onText: PropTypes.func,
  onError: PropTypes.func,
  children: PropTypes.node,
};
