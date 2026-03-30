import CodeMirror from 'codemirror';
import PropTypes from 'prop-types';
import Editor from './Editor';

import 'codemirror/addon/hint/show-hint.css';
import 'codemirror/addon/tern/tern.css';

/** @type {CodeMirror.TernServer | null} */
let server;

// @ts-expect-error — propTypes static is a subset of Editor.propTypes (missing enableFormatting); intentional as this subclass doesn't use it
export default class JSCodeshiftEditor extends Editor {
  /** @param {import('./Editor').EditorProps} props */
  constructor(props) {
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

    this._bindCMHandler('cursorActivity', /** @param {CodeMirror.Editor} cm */ cm => {
      server && server.updateArgHints(cm);
    });
  }
}

/** @returns {void} */
function loadTern() {
  require(
    [
      'codemirror/addon/hint/show-hint',
      'codemirror/addon/tern/tern',
      'acorn',
    ],
    (_1: unknown, _2: unknown, acorn: typeof import('acorn')) => {
      global.acorn = acorn;
      require(
        [
          'tern',
          'tern/plugin/doc_comment',
          'tern/lib/infer',
          '../defs/jscodeshift.json',
          'tern/defs/ecmascript.json',
        ],
        (/** @type {{registerPlugin: (name: string, init: (...args: unknown[]) => void) => void, [k: string]: unknown}} */ tern, _: unknown, /** @type {{cx: () => {topScope: unknown, definitions: Record<string, Record<string, unknown>>}, IsCallee: {new(...args: unknown[]): unknown}, ANull: unknown, [k: string]: unknown}} */ infer, jscs_def: unknown, ecmascript: unknown) => {
          global.tern = tern;
          tern.registerPlugin('transformer', /** @param {{on: (event: string, handler: (...args: unknown[]) => void) => void} & Record<string, unknown>} server */ server => {
            server.on('afterLoad', /** @param {{scope: {props: Record<string, {getFunctionType: () => {propagate: (arg: unknown) => void}}>}} & Record<string, unknown>} file */ file => {
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
                  null,
                  infer.ANull,
                ));
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
