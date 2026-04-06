import React from 'react';
import { categories } from 'astexplorer-parsers';

function importEscodegen(): Promise<{generate: (ast: unknown, options: unknown) => string}> {
  return new Promise(resolve => { require(['escodegen'], (...modules: unknown[]) => { resolve(modules[0] as {generate: (ast: unknown, options: unknown) => string}); }); });
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
  container: HTMLElement | null = null;

    constructor(props: PasteDropTargetProps) {
    super(props);
    this.state = {
      dragging: false,
    };
  }

    _onASTError(type: string, event: Event, ex: Error) {
    this.props.onError?.(
      type,
      event,
      `Cannot process pasted AST: ${ex.message}`,
    );
    throw ex;
  }

  componentDidMount() {
        this._listeners = [];
    const target = this.container;

    // Handle pastes
    this._bindListener(document, 'paste', (event: Event) => {
      const clipboardEvent = event as ClipboardEvent;
      if (clipboardEvent.clipboardData === null || clipboardEvent.clipboardData === undefined) {
        // No browser support? :(
        return;
      }
      const cbdata = clipboardEvent.clipboardData;
      // Plain text
      if (!Array.isArray(cbdata.types) || !cbdata.types.includes('text/plain')) {
        return;
      }
      event.stopPropagation();
      event.preventDefault();
      this._jsonToCode(cbdata.getData('text/plain')).then(
        code => this.props.onText?.('paste', event, code),
        (ex: Error) => {
          if (event.target instanceof Element && event.target.nodeName !== 'TEXTAREA') {
            this._onASTError('paste', event, ex);
          }
        },
      );
    }, true);

        let timer: ReturnType<typeof setTimeout> | undefined;

    // Handle file drops
    if (target !== null) {
      this._bindListener(target, 'dragenter', (event: Event) => {
        clearTimeout(timer);
        event.preventDefault();
        this.setState({dragging: true});
      }, true);

      this._bindListener(target, 'dragover', (event: Event) => {
        const dragEvent = event as DragEvent;
        clearTimeout(timer);
        event.preventDefault();
        if (dragEvent.dataTransfer !== null) {
          dragEvent.dataTransfer.dropEffect = 'copy';
        }
      }, true);

      this._bindListener(target, 'drop', (event: Event) => {
        const dragEvent = event as DragEvent;
        this.setState({dragging: false});
        if (dragEvent.dataTransfer === null) {
          return;
        }
        const file = dragEvent.dataTransfer.files[0];
        let categoryId: string | undefined = acceptedFileTypes.get(file.type);
        if (categoryId === undefined || this.props.onText === undefined) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const dropEvent = event;
        void file.text().then((fileText: string) => {
          let text: string | Promise<string> = fileText;
          if (categoryId === 'JSON' || categoryId === 'TEXT') {
            text = this._jsonToCode(fileText).then(
              (codeText: string) => {
                categoryId = 'javascript';
                return codeText;
              },
              (ex: Error) => {
                if (categoryId === 'JSON') {
                  this._onASTError('drop', dropEvent, ex);
                }
                categoryId = undefined;
                return fileText;
              },
            );
          }
          return Promise.resolve(text).then((resolvedText: string) => {
            this.props.onText?.('drop', dropEvent, resolvedText, categoryId);
            return null;
          });
        });
      }, true);

      this._bindListener(target, 'dragleave', () => {
        clearTimeout(timer);
        timer = setTimeout(() => this.setState({dragging: false}), 50);
      }, true);
    }
  }

  componentWillUnmount() {
    if (this._listeners !== null) {
      for (const removeListener of this._listeners) {
        removeListener();
      }
    }
    this._listeners = null;
  }

    _jsonToCode(json: string): Promise<string> {
    let ast: unknown;
    try {
      ast = JSON.parse(json) as unknown;
    }
    catch {
      return Promise.resolve(json);
    }
    return importEscodegen().then((escodegen) => {
      return escodegen.generate(ast, {format: {indent: {style: '  '}}});
    });
  }

    _bindListener(elem: EventTarget, event: string, listener: (event: Event) => void, capture?: boolean) {
    if (this._listeners === null) {
      return;
    }
    for (const e of event.split(/\s+/)) {
      elem.addEventListener(e, listener, capture);
      this._listeners.push(
        () => elem.removeEventListener(e, listener, capture),
      );
    }
  }

  render() {
    const {children, onText: _onText, ...props} = this.props;
    const dropindicator = this.state.dragging ?
      <div className="dropIndicator">
        <div>Drop the code or (JSON-encoded) AST file here</div>
      </div> :
      null;

    return (
      <div
        ref={c => { this.container = c; }}
        {...props}>
        {dropindicator}
        {children}
      </div>
    );
  }
}

