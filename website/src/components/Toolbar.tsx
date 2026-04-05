import React from 'react';
import CategoryButton from './buttons/CategoryButton';
import ParserButton from './buttons/ParserButton';
import SnippetButton from './buttons/SnippetButton';
import TransformButton from './buttons/TransformButton';
import KeyMapButton from './buttons/KeyMapButton';
import type {Parser, Transformer} from '../types';

type ToolbarProps = Record<string, unknown> & {
  parser: Parser;
  transformer?: Transformer;
  showTransformer?: boolean;
};

export default function Toolbar(props: ToolbarProps): React.ReactElement {
  const {parser, transformer, showTransformer} = props;
  let parserInfo: string | React.ReactElement = String(parser.displayName);
  let transformerInfo: string | React.ReactElement = '';
  if (parser.version !== undefined && parser.version !== '') {
    parserInfo = String(parserInfo) + '-' + String(parser.version);
  }
  if (parser.homepage !== undefined && parser.homepage !== '') {
    parserInfo =
      <a href={parser.homepage} target="_blank" rel="noopener noreferrer">{parserInfo}</a>;
  }
  if (showTransformer === true && transformer !== undefined) {
    transformerInfo = String(transformer.displayName);
    if (transformer.version !== undefined && transformer.version !== '') {
      transformerInfo = String(transformerInfo) + '-' + String(transformer.version);
    }
    if (transformer.homepage !== undefined && transformer.homepage !== '') {
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
      <div id="info" className={transformerInfo === '' ? '' : 'small'}>
        Parser: {parserInfo}<br />
        {transformerInfo}
      </div>
    </div>
  );
}

