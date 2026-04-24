import * as monaco from 'monaco-editor';
import Editor from './Editor';
import type { EditorProps } from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';
import { findHoverBoundary } from '../utils/treegexHoverBoundary';

// tree-gex type definitions for Monaco IntelliSense.
import treeGexDts from '../treegex.d.ts.txt?raw';

let configured = false;

/**
 * Create hidden models containing type definitions.
 * Monaco's JS language service automatically picks up all JS models
 * (including these) and shares type information between them.
 * This avoids the `addExtraLib` split-instance issue with Vite pre-bundling.
 */
function configureTypeDefs() {
  if (configured) return;
  configured = true;

  // Create type-definition models using 'javascript' language so the JS
  // worker picks them up. The .d.ts URI extension tells the TS compiler
  // inside the worker to treat them as declaration files.
  monaco.editor.createModel(
    `declare module 'tree-gex' {\n${treeGexDts}\n}`,
    'javascript',
    monaco.Uri.parse('file:///node_modules/tree-gex/index.d.ts'),
  );

  monaco.editor.createModel(
    'declare const ast: unknown;',
    'javascript',
    monaco.Uri.parse('file:///globals.d.ts'),
  );
}

type TreeGexEditorProps = EditorProps & {
  /** When true, hovering over tree-gex code draws a boundary around the
   *  sub-expression that would be captured and drives the transform's
   *  capture-group wrapping via `onHoverOffset`. */
  hoverMode?: boolean;
  /** Notified with the mouse offset inside the editor while hover-mode is
   *  on (null when the mouse leaves or is not over a wrappable expression).
   *  Reuses the transform-cursor pipeline to trigger AST/source highlights. */
  onHoverOffset?: (offset: number | null) => void;
};

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';
  declare props: TreeGexEditorProps;
  _hoverDecorationIds: string[] = [];
  _hoverDisposable: monaco.IDisposable | null = null;
  _hoverLeaveDisposable: monaco.IDisposable | null = null;
  _hoverDebounce: ReturnType<typeof setTimeout> | undefined;
  _lastHoverOffset: number | null = null;

  componentDidMount() {
    configureTypeDefs();
    void ensureLanguageRegistered('javascript');
    // Load TS tokenizer so hover popups can highlight TypeScript code blocks.
    void ensureLanguageRegistered('typescript');
    super.componentDidMount();
    this._bindHoverHandlers();
  }

  shouldComponentUpdate(nextProps: TreeGexEditorProps) {
    // The base Editor filters out updates that only change non-content props;
    // we need to hear hoverMode toggles to bind/unbind our mouse handlers.
    if (nextProps.hoverMode !== this.props.hoverMode) return true;
    return super.shouldComponentUpdate(nextProps);
  }

  componentDidUpdate(prevProps: TreeGexEditorProps, prevState: { value: string }) {
    super.componentDidUpdate(prevProps, prevState);
    const hoverOn = this.props.hoverMode === true;
    const wasOn = prevProps.hoverMode === true;
    if (hoverOn && !wasOn) {
      this._bindHoverHandlers();
    } else if (!hoverOn && wasOn) {
      this._unbindHoverHandlers();
      this._clearHoverDecoration();
      // Clear downstream captures so highlights don't linger.
      if (this.props.onHoverOffset) this.props.onHoverOffset(null);
    }
  }

  componentWillUnmount() {
    this._unbindHoverHandlers();
    this._clearHoverDecoration();
    super.componentWillUnmount();
  }

  _bindHoverHandlers() {
    if (this.props.hoverMode !== true) return;
    const editor = this.monacoEditor;
    if (!editor) return;
    if (this._hoverDisposable) return;
    this._hoverDisposable = editor.onMouseMove((e) => this._onMouseMove(e));
    this._hoverLeaveDisposable = editor.onMouseLeave(() => this._onMouseLeave());
  }

  _unbindHoverHandlers() {
    if (this._hoverDisposable) {
      this._hoverDisposable.dispose();
      this._hoverDisposable = null;
    }
    if (this._hoverLeaveDisposable) {
      this._hoverLeaveDisposable.dispose();
      this._hoverLeaveDisposable = null;
    }
    clearTimeout(this._hoverDebounce);
    this._lastHoverOffset = null;
  }

  _onMouseMove(e: monaco.editor.IEditorMouseEvent) {
    const editor = this.monacoEditor;
    if (!editor) return;
    const model = editor.getModel();
    if (!model) return;

    const target = e.target;
    if (target.type !== monaco.editor.MouseTargetType.CONTENT_TEXT) {
      this._clearHoverDecoration();
      this._scheduleHoverOffset(null);
      return;
    }
    const position = target.position;
    if (!position) {
      this._clearHoverDecoration();
      this._scheduleHoverOffset(null);
      return;
    }
    const offset = model.getOffsetAt(position);
    if (offset === this._lastHoverOffset) return;
    this._lastHoverOffset = offset;

    const code = model.getValue();
    const boundary = findHoverBoundary(code, offset);
    if (!boundary) {
      this._clearHoverDecoration();
      this._scheduleHoverOffset(null);
      return;
    }

    this._drawHoverDecoration(model, boundary);
    // Send the actual mouse offset — not the midpoint — so the parsers'
    // capture pipeline picks the same sub-expression we just outlined.
    this._scheduleHoverOffset(offset);
  }

  _onMouseLeave() {
    this._clearHoverDecoration();
    clearTimeout(this._hoverDebounce);
    this._lastHoverOffset = null;
    if (this.props.onHoverOffset) this.props.onHoverOffset(null);
  }

  _scheduleHoverOffset(offset: number | null) {
    clearTimeout(this._hoverDebounce);
    this._hoverDebounce = setTimeout(() => {
      if (this.props.onHoverOffset) this.props.onHoverOffset(offset);
    }, 120);
  }

  _drawHoverDecoration(model: monaco.editor.ITextModel, boundary: [number, number]) {
    const editor = this.monacoEditor;
    if (!editor) return;
    const startPos = model.getPositionAt(boundary[0]);
    const endPos = model.getPositionAt(boundary[1]);
    if (!startPos || !endPos) return;
    this._hoverDecorationIds = editor.deltaDecorations(this._hoverDecorationIds, [
      {
        range: new monaco.Range(
          startPos.lineNumber,
          startPos.column,
          endPos.lineNumber,
          endPos.column,
        ),
        options: { className: 'tg-hover-boundary' },
      },
    ]);
  }

  _clearHoverDecoration() {
    const editor = this.monacoEditor;
    if (editor && this._hoverDecorationIds.length > 0) {
      this._hoverDecorationIds = editor.deltaDecorations(this._hoverDecorationIds, []);
    } else {
      this._hoverDecorationIds = [];
    }
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  mode: 'javascript',
});
