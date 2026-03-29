import PropTypes from 'prop-types';
import React from 'react';
import CategoryButton from './buttons/CategoryButton';
import ParserButton from './buttons/ParserButton';
import SnippetButton from './buttons/SnippetButton';
import TransformButton from './buttons/TransformButton';
import KeyMapButton from './buttons/KeyMapButton';

/**
 * @param {Object} props
 * @param {boolean} [props.saving]
 * @param {boolean} [props.forking]
 * @param {() => void} [props.onSave]
 * @param {() => void} [props.onFork]
 * @param {(parser: import('../types.js').Parser) => void} [props.onParserChange]
 * @param {() => void} [props.onParserSettingsButtonClick]
 * @param {() => void} [props.onShareButtonClick]
 * @param {(transformer: import('../types.js').Transformer | null) => void} [props.onTransformChange]
 * @param {(keyMap: string) => void} [props.onKeyMapChange]
 * @param {import('../types.js').Parser} props.parser
 * @param {import('../types.js').Transformer} [props.transformer]
 * @param {boolean} [props.showTransformer]
 * @param {boolean} [props.canSave]
 * @param {boolean} [props.canFork]
 * @returns {React.ReactElement}
 */
export default function Toolbar(props) {
  let {parser, transformer, showTransformer} = props;
  let parserInfo = parser.displayName;
  let transformerInfo = '';
  if (parser) {
    if (parser.version) {
      parserInfo += '-' + parser.version;
    }
    if (parser.homepage) {
      parserInfo =
        <a href={parser.homepage} target="_blank" rel="noopener noreferrer">{parserInfo}</a>;
    }
  }
  if (showTransformer) {
    transformerInfo = transformer.displayName;
    if (transformer.version) {
      transformerInfo += '-' + transformer.version;
    }
    if (transformer.homepage) {
      transformerInfo =
        <a href={transformer.homepage} target="_blank" rel="noopener noreferrer">{transformerInfo}</a>;
    }
    transformerInfo = <span>Transformer: {transformerInfo}</span>;
  }

  return (
    <div id="Toolbar">
      <h1>AST Explorer</h1>
      <SnippetButton {...props} />
      <CategoryButton {...props} />
      <ParserButton {...props} />
      <TransformButton {...props} />
      <KeyMapButton {...props} />
      <a
        style={{minWidth: 0}}
        target="_blank" rel="noopener noreferrer"
        title="Help"
        href="https://github.com/fkling/astexplorer/blob/master/README.md">
        <i className="fa fa-lg fa-question fa-fw" />
      </a>
      <div id="info" className={transformerInfo ? 'small' : ''}>
        Parser: {parserInfo}<br />
        {transformerInfo}
      </div>
    </div>
  );
}

Toolbar.propTypes = {
  saving: PropTypes.bool,
  forking: PropTypes.bool,
  onSave: PropTypes.func,
  onFork: PropTypes.func,
  onParserChange: PropTypes.func,
  onParserSettingsButtonClick: PropTypes.func,
  onShareButtonClick: PropTypes.func,
  onTransformChange: PropTypes.func,
  onKeyMapChange: PropTypes.func,
  parser: PropTypes.object,
  transformer: PropTypes.object,
  showTransformer: PropTypes.bool,
  canSave: PropTypes.bool,
  canFork: PropTypes.bool,
};
