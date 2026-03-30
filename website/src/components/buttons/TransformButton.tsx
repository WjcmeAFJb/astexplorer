import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames';
import {getTransformerByID} from '../../parsers';

type TransformButtonProps = {
  category?: import('../../types').Category;
  transformer?: import('../../types').Transformer;
  showTransformer?: boolean;
  onTransformChange?: (transformer: import('../../types').Transformer | null) => void;
};

export default class TransformButton extends React.Component<TransformButtonProps> {
    constructor(props: TransformButtonProps) {
    super(props);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._onClick = this._onClick.bind(this);
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._onToggle = this._onToggle.bind(this);
  }

  // @ts-expect-error — target is EventTarget but used as HTMLElement; onClick always fires on HTML elements
  _onClick({target}) {
    let transformID;
    if ((target as HTMLElement).nodeName.toLowerCase() === 'li') {
      transformID = ((target as HTMLElement).children[0] as HTMLButtonElement).value;
    } else {
      transformID = (target as HTMLButtonElement).value;
    }
    this.props.onTransformChange(getTransformerByID(transformID));
  }

  _onToggle() {
    if (this.props.transformer) {
      this.props.onTransformChange(null);
    }
  }

  render() {
    const transformers = this.props.category.transformers.filter(
      t => t.showInMenu !== false || t == this.props.transformer,
    );
    return (
      <div className={cx({
        button: true,
        menuButton: true,
        disabled: !this.props.category.transformers.length,
      })}>
        <button
          type="button"
          onClick={this._onToggle}
          disabled={!this.props.category.transformers.length}>
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-toggle-off': !this.props.showTransformer,
              'fa-toggle-on': this.props.showTransformer,
              'fa-fw': true,
            })}
          />
          &nbsp;Transform
        </button>
        {!!transformers.length && <ul>
          {transformers.map(transformer => (
            <li
              key={transformer.id}
              className={cx({
                selected: this.props.showTransformer &&
                  this.props.transformer === transformer,
              })}
              onClick={this._onClick}>
              <button value={transformer.id} type="button" >
                {transformer.displayName}
              </button>
            </li>
          ))}
        </ul>}
      </div>
    );
  }
}

TransformButton.propTypes = {
  category: PropTypes.object,
  transformer: PropTypes.object,
  showTransformer: PropTypes.bool,
  onTransformChange: PropTypes.func,
};
