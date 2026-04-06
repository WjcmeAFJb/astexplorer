import CodeMirror from 'codemirror';
import Editor from './Editor';
import type {EditorProps} from './Editor';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/tern/tern.css';

// Tern server instance — dynamically loaded
let server: CodeMirror.TernServer | undefined;

export default class JSCodeshiftEditor extends Editor {
    constructor(props: EditorProps) {
    super(props);
    loadTern();
  }

  componentDidMount() {
    super.componentDidMount();

    if (this.codeMirror === null) return;
    this.codeMirror.setOption('extraKeys', {
      'Ctrl-Space': (cm: CodeMirror.Editor) => { if (server !== undefined) server.complete(cm); },
      'Ctrl-I': (cm: CodeMirror.Editor) => { if (server !== undefined) server.showType(cm); },
      'Ctrl-O': (cm: CodeMirror.Editor) => { if (server !== undefined) server.showDocs(cm); },
    });

    this._bindCMHandler('cursorActivity', (cm: CodeMirror.Editor) => {
      if (server !== undefined) server.updateArgHints(cm);
    });
  }
}

interface TernServerScope {
  props: Record<string, { getFunctionType?: () => { propagate: (callee: unknown) => void } } | undefined>;
}

interface TernServerFile {
  scope: TernServerScope;
}

interface TernServerInstance {
  on(event: string, callback: (file: TernServerFile) => void): void;
}

interface TernModule {
  registerPlugin(name: string, init: (server: TernServerInstance) => void): void;
  [k: string]: unknown;
}

interface InferModule {
  cx(): { topScope: unknown; definitions: Record<string, Record<string, unknown>> };
  IsCallee: { new(...args: unknown[]): unknown };
  ANull: unknown;
  [k: string]: unknown;
}

function loadTern(): void {
  require(
    [
      'codemirror/addon/hint/show-hint',
      'codemirror/addon/tern/tern',
      'acorn',
    ],
    (_showHint: unknown, _ternAddon: unknown, acorn: Record<string, unknown>) => {
      globalThis.acorn = acorn;
      require(
        [
          'tern',
          'tern/plugin/doc_comment',
          'tern/lib/infer',
          '../defs/jscodeshift.json',
          'tern/defs/ecmascript.json',
        ],
        (tern: TernModule, _docComment: unknown, infer: InferModule, jscs_def: unknown, ecmascript: unknown) => {
          globalThis.tern = tern;
          tern.registerPlugin('transformer', (ternServer: TernServerInstance) => {
            ternServer.on('afterLoad', (file: TernServerFile) => {
              const fnVal = file.scope.props.transformer;
              if (fnVal !== undefined && fnVal !== null) {
                const fnType = fnVal.getFunctionType?.();
                if (fnType !== undefined) {
                  const cx = infer.cx();
                  fnType.propagate(new infer.IsCallee(
                    infer.cx().topScope,
                    [
                      cx.definitions.jscodeshift.file,
                      cx.definitions.jscodeshift.apiObject,
                    ],
                    null,
                    infer.ANull,
                  ));
                }
              }
            });
          });

          server = new CodeMirror.TernServer({
            defs: [jscs_def, ecmascript],
            plugins: {
              transformer: {strong: true},
            },
          });
        },
      );
    },
  );
}

JSCodeshiftEditor.defaultProps = Object.assign(
  {},
  Editor.defaultProps,
  {
    highlight: false,
  },
);
