import React from 'react';
import {getParserByID} from 'astexplorer-parsers';
import type {Parser, Category} from '../../types';

type ParserButtonProps = {
  onParserChange?: (parser: Parser) => void;
  onParserSettingsButtonClick?: () => void;
  parser?: Parser;
  category?: Category;
};

export default class ParserButton extends React.Component<ParserButtonProps> {
  static displayName = 'ParserButton';
  _onClick = ({currentTarget}: {currentTarget: HTMLElement}) => {
    const parserID = currentTarget.dataset.id ?? '';
    if (this.props.onParserChange) this.props.onParserChange(getParserByID(parserID));
  };

  render() {
    const parsers = this.props.category ? this.props.category.parsers.filter(p => p.showInMenu) : [];
    return (
      <div className="button menuButton">
        <span>
          <i className='fa fa-lg fa-code fa-fw' />
          &nbsp;{this.props.parser ? this.props.parser.displayName : ''}
        </span>
        <ul>
          {parsers.map(parser => (
            <li key={parser.id} onClick={this._onClick} onKeyDown={this._onClick} data-id={parser.id}>
              <button type="button" >
                {parser.displayName}
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          title="Parser Settings"
          style={{minWidth: 0}}
          disabled={!this.props.parser || !this.props.parser.hasSettings()}
          onClick={this.props.onParserSettingsButtonClick}>
          <i className="fa fa-cog fa-fw" />
        </button>
      </div>
    );
  }
}

