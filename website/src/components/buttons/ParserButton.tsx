import PropTypes from 'prop-types';
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
    constructor(props: ParserButtonProps) {
    super(props);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._onClick = this._onClick.bind(this);
  }

  _onClick({currentTarget}: {currentTarget: HTMLElement}) {
    let parserID = currentTarget.dataset.id;
    this.props.onParserChange(getParserByID(parserID));
  }

  render() {
    const parsers = this.props.category.parsers.filter(p => p.showInMenu);
    return (
      <div className="button menuButton">
        <span>
          <i className='fa fa-lg fa-code fa-fw' />
          &nbsp;{this.props.parser.displayName}
        </span>
        <ul>
          {parsers.map(parser => (
            <li key={parser.id} onClick={this._onClick} data-id={parser.id}>
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
          disabled={!this.props.parser.hasSettings()}
          onClick={this.props.onParserSettingsButtonClick}>
          <i className="fa fa-cog fa-fw" />
        </button>
      </div>
    );
  }
}

ParserButton.propTypes = {
  onParserChange: PropTypes.func,
  onParserSettingsButtonClick: PropTypes.func,
  parser: PropTypes.object,
  category: PropTypes.object,
};
