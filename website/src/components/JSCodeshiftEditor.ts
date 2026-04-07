import Editor from './Editor';

// JSCodeshiftEditor previously extended the CodeMirror Editor with Tern server
// autocomplete. Monaco has built-in JavaScript/TypeScript IntelliSense, so
// we no longer need Tern. This class is kept for API compatibility.

export default class JSCodeshiftEditor extends Editor {}

JSCodeshiftEditor.defaultProps = Object.assign({}, Editor.defaultProps, {
  highlight: false,
});
