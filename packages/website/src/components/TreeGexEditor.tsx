import * as monaco from 'monaco-editor';
import Editor from './Editor';
import type { EditorProps } from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';
import { findHoverBoundary } from '../utils/treegexHoverBoundary';

// tree-gex type definitions for Monaco IntelliSense.
import treeGexDts from '../treegex.d.ts.txt?raw';

let configured = false;

/**
 * Install tree-gex type definitions into Monaco's TypeScript language service
 * so autocomplete, hover info, parameter hints, and diagnostics all resolve
 * against the real tree-gex API while the user types. The declarations are
 * registered as extra libs on both the TS and JS defaults — the same
 * underlying worker handles both languages.
 *
 * Also declares an ambient `ast` global so patterns that reference it by
 * name don't trip "cannot find name 'ast'" diagnostics.
 *
 * The `edcore.main` monaco entry doesn't auto-attach the TS language service
 * onto `monaco.languages.typescript`; the TS contribution exports its API
 * directly. We import it from the contribution module so we can wire up
 * the tree-gex type definitions and compiler options.
 */
type TSContributionModule = {
  typescriptDefaults: {
    addExtraLib: (content: string, filePath: string) => void;
    setCompilerOptions: (options: Record<string, unknown>) => void;
  };
  javascriptDefaults: {
    addExtraLib: (content: string, filePath: string) => void;
    setCompilerOptions: (options: Record<string, unknown>) => void;
  };
  ScriptTarget: { ESNext: number };
  ModuleKind: { ESNext: number };
  ModuleResolutionKind: { NodeJs: number };
};

async function configureTypeDefs(): Promise<void> {
  if (configured) return;
  configured = true;

  const tsModule =
    (await import('monaco-editor/esm/vs/language/typescript/monaco.contribution')) as unknown as TSContributionModule;

  const treeGexSource = `declare module 'tree-gex' {\n${treeGexDts}\n}`;
  const globalsSource = 'declare const ast: unknown;';

  // addExtraLib is the official entry point for supplying project-wide type
  // information to Monaco's TS worker. Registering on both defaults means a
  // JS-mode editor would also see the types, and avoids the subtle per-
  // language lib split.
  tsModule.typescriptDefaults.addExtraLib(
    treeGexSource,
    'file:///node_modules/tree-gex/index.d.ts',
  );
  tsModule.typescriptDefaults.addExtraLib(globalsSource, 'file:///globals.d.ts');
  tsModule.javascriptDefaults.addExtraLib(
    treeGexSource,
    'file:///node_modules/tree-gex/index.d.ts',
  );
  tsModule.javascriptDefaults.addExtraLib(globalsSource, 'file:///globals.d.ts');

  // Keep the TS worker from flagging the module-resolution artifacts the
  // type-def files rely on. `esModuleInterop` lets `import * as w` work
  // against the `declare module` form, and targeting a modern lib means
  // newer syntax in the transform code doesn't trip spurious errors.
  tsModule.typescriptDefaults.setCompilerOptions({
    target: tsModule.ScriptTarget.ESNext,
    module: tsModule.ModuleKind.ESNext,
    moduleResolution: tsModule.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
  });
  tsModule.javascriptDefaults.setCompilerOptions({
    target: tsModule.ScriptTarget.ESNext,
    module: tsModule.ModuleKind.ESNext,
    moduleResolution: tsModule.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    strict: false,
  });
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
    // Load the TS tokenizer and rich language service (IntelliSense, hover,
    // signature help, diagnostics). Both land in the same TS worker instance.
    void ensureLanguageRegistered('typescript').then(() => configureTypeDefs());
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
  // Native TypeScript mode — Monaco's built-in TS contribution already
  // handles tokenization, and the rich TS language service it loads provides
  // semantic coloring, IntelliSense, signature help, hover info, and
  // diagnostics without us writing a parser.
  mode: 'typescript',
});
