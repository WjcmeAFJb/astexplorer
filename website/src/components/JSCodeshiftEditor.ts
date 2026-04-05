// oxlint-disable unicorn/filename-case -- PascalCase with JS acronym is conventional for React components
import CodeMirror from 'codemirror';
import PropTypes from 'prop-types';
import Editor from './Editor';
import type {EditorProps} from './Editor';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/tern/tern.css';

// Tern server instance — dynamically loaded, no public TypeScript definitions exist
// oxlint-disable-next-line typescript-eslint(no-explicit-any) -- Tern has no @types package
let server: any;

export default class JSCodeshiftEditor extends Editor {
    constructor(props: EditorProps) {
    super(props);
    loadTern();
  }

  componentDidMount() {
    super.componentDidMount();

    this.codeMirror.setOption('extraKeys', {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access -- Tern API
      'Ctrl-Space': (cm: CodeMirror.Editor) => { if (server !== undefined) server.complete(cm); },
      // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access -- Tern API
      'Ctrl-I': (cm: CodeMirror.Editor) => { if (server !== undefined) server.showType(cm); },
      // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access -- Tern API
      'Ctrl-O': (cm: CodeMirror.Editor) => { if (server !== undefined) server.showDocs(cm); },
    });

    this._bindCMHandler('cursorActivity', (cm: CodeMirror.Editor) => {
      // oxlint-disable-next-line typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access -- Tern API
      if (server !== undefined) server.updateArgHints(cm);
    });
  }
}

// oxlint-disable-next-line max-lines-per-function -- deeply nested async require callbacks cannot be split without losing closure context
function loadTern(): void {
  require(
    [
      'codemirror/addon/hint/show-hint',
      'codemirror/addon/tern/tern',
      'acorn',
    ],
    (_1: unknown, _2: unknown, acorn: { [key: string]: unknown }) => {
      globalThis.acorn = acorn;
      require(
        [
          'tern',
          'tern/plugin/doc_comment',
          'tern/lib/infer',
          '../defs/jscodeshift.json',
          'tern/defs/ecmascript.json',
        ],
        // oxlint-disable-next-line typescript-eslint/no-explicit-any -- Tern plugin API: untyped internals with no @types package */
        (tern: {registerPlugin: (name: string, init: (...args: unknown[]) => void) => void, [k: string]: unknown}, _: unknown, infer: {cx: () => {topScope: unknown, definitions: Record<string, Record<string, unknown>>}, IsCallee: {new(...args: unknown[]): unknown}, ANull: unknown, [k: string]: unknown}, jscs_def: unknown, ecmascript: unknown) => {
          globalThis.tern = tern;
          /* oxlint-disable typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-return, typescript-eslint/no-explicit-any, typescript-eslint/no-unsafe-type-assertion -- Tern plugin API: untyped internals with no @types package */
          tern.registerPlugin('transformer', (ternServer: any) => {
            ternServer.on('afterLoad', (file: any) => {
              const fnVal = file.scope.props.transformer;
              if (fnVal !== undefined && fnVal !== null) {
                const fnType = fnVal.getFunctionType();
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
            });
          });
          /* oxlint-enable typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-return, typescript-eslint/no-explicit-any, typescript-eslint/no-unsafe-type-assertion */

          // oxlint-disable-next-line typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-explicit-any, typescript-eslint/no-unsafe-type-assertion -- TernServer constructor not in @types/codemirror
          server = new (CodeMirror as any).TernServer({
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

JSCodeshiftEditor.propTypes = {
  value: PropTypes.string,
  highlight: PropTypes.bool,
  lineNumbers: PropTypes.bool,
  readOnly: PropTypes.bool,
  onContentChange: PropTypes.func,
  onActivity: PropTypes.func,
  posFromIndex: PropTypes.func,
  error: PropTypes.object,
  mode: PropTypes.string,
  keyMap: PropTypes.string,
};

JSCodeshiftEditor.defaultProps = Object.assign(
  {},
  Editor.defaultProps,
  {
    highlight: false,
  },
);
