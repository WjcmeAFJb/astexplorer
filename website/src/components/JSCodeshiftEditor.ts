// oxlint-disable typescript-eslint/no-unsafe-assignment, typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-return, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/strict-boolean-expressions -- Tern/CodeMirror addon APIs are untyped; no type definitions available
import CodeMirror from 'codemirror';
import PropTypes from 'prop-types';
import Editor from './Editor';
import type {EditorProps} from './Editor';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/tern/tern.css';

// oxlint-disable-next-line typescript-eslint(no-explicit-any) -- Tern server is dynamically loaded with no public type definition
let server: any;

export default class JSCodeshiftEditor extends Editor {
    constructor(props: EditorProps) {
    super(props);
    loadTern();
  }

  componentDidMount() {
    super.componentDidMount();

    this.codeMirror.setOption('extraKeys', {
      'Ctrl-Space': cm => server && server.complete(cm),
      'Ctrl-I': cm => server && server.showType(cm),
      'Ctrl-O': cm => server && server.showDocs(cm),
    });

    this._bindCMHandler('cursorActivity', (cm: CodeMirror.Editor) => {
      if (server) server.updateArgHints(cm);
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
        (tern: {registerPlugin: (name: string, init: (...args: unknown[]) => void) => void, [k: string]: unknown}, _: unknown, infer: {cx: () => {topScope: unknown, definitions: Record<string, Record<string, unknown>>}, IsCallee: {new(...args: unknown[]): unknown}, ANull: unknown, [k: string]: unknown}, jscs_def: unknown, ecmascript: unknown) => {
          globalThis.tern = tern;
          // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- Tern plugin callback receives untyped server object
          tern.registerPlugin('transformer', (ternServer: any) => {
            // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- Tern afterLoad callback receives untyped file object
            ternServer.on('afterLoad', (file: any) => {
              const fnVal = file.scope.props.transformer;
              if (fnVal) {
                const fnType = fnVal.getFunctionType();
                const cx = infer.cx();
                fnType.propagate(new infer.IsCallee(
                  infer.cx().topScope,
                  [
                    cx.definitions.jscodeshift.file,
                    cx.definitions.jscodeshift.apiObject,
                  ],
                  // oxlint-disable-next-line unicorn/no-null -- Tern API requires null as the third argument to IsCallee constructor
                  null,
                  infer.ANull,
                ));
              }
            });
          });

          // oxlint-disable-next-line typescript-eslint(no-explicit-any) -- TernServer is a CodeMirror addon not in @types/codemirror
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
