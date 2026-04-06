import React from 'react';
import CategoryButton from './buttons/CategoryButton';
import ParserButton from './buttons/ParserButton';
import SnippetButton from './buttons/SnippetButton';
import TransformButton from './buttons/TransformButton';
import KeyMapButton from './buttons/KeyMapButton';
import type {Category, Parser, Transformer} from '../types';

type ToolbarProps = {
  parser: Parser;
  transformer?: Transformer | null;
  showTransformer?: boolean;
  // CategoryButton props
  category?: Category;
  onCategoryChange?: (category: Category) => void;
  // ParserButton props
  onParserChange?: (parser: Parser) => void;
  onParserSettingsButtonClick?: () => void;
  // TransformButton props
  onTransformChange?: (transformer: Transformer | null) => void;
  // SnippetButton props
  canFork?: boolean;
  canSave?: boolean;
  forking?: boolean;
  saving?: boolean;
  onFork?: () => void;
  onSave?: () => void;
  onNew?: () => void;
  onShareButtonClick?: () => void;
  snippet?: unknown;
  // KeyMapButton props
  onKeyMapChange?: (keyMap: string) => void;
  keyMap?: string;
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
  if (showTransformer === true && transformer !== null && transformer !== undefined) {
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
      <SnippetButton
        canFork={props.canFork}
        canSave={props.canSave}
        forking={props.forking}
        saving={props.saving}
        onFork={props.onFork}
        onSave={props.onSave}
        onNew={props.onNew}
        onShareButtonClick={props.onShareButtonClick}
        snippet={props.snippet}
      />
      <CategoryButton
        category={props.category}
        onCategoryChange={props.onCategoryChange}
      />
      <ParserButton
        parser={props.parser}
        category={props.category}
        onParserChange={props.onParserChange}
        onParserSettingsButtonClick={props.onParserSettingsButtonClick}
      />
      <TransformButton
        category={props.category}
        transformer={transformer ?? undefined}
        showTransformer={props.showTransformer}
        onTransformChange={props.onTransformChange}
      />
      <KeyMapButton
        keyMap={props.keyMap}
        onKeyMapChange={props.onKeyMapChange}
      />
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

