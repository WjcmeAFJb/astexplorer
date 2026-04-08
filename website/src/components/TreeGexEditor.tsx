import * as monaco from 'monaco-editor';
import Editor from './Editor';
import { ensureLanguageRegistered } from '../monacoLanguages';

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

export default class TreeGexEditor extends Editor {
  static displayName = 'TreeGexEditor';

  componentDidMount() {
    configureTypeDefs();
    void ensureLanguageRegistered('javascript');
    super.componentDidMount();
  }
}

TreeGexEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  mode: 'javascript',
});
