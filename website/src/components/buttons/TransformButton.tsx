import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames';
import {getTransformerByID} from 'astexplorer-parsers';
import type {Category, Transformer} from '../../types';

type TransformButtonProps = {
  category?: Category;
  transformer?: Transformer;
  showTransformer?: boolean;
  onTransformChange?: (transformer: Transformer | null) => void;
};

export default class TransformButton extends React.Component<TransformButtonProps> {
  static displayName = 'TransformButton';

  _onClick = (event: React.MouseEvent<HTMLLIElement> | React.KeyboardEvent<HTMLLIElement>) => {
    const target = event.target;
    let transformID: string;
    if (target instanceof HTMLLIElement) {
      const firstChild = target.children[0];
      if (firstChild instanceof HTMLButtonElement) {
        transformID = firstChild.value;
      } else {
        return;
      }
    } else if (target instanceof HTMLButtonElement) {
      transformID = target.value;
    } else {
      return;
    }
    this.props.onTransformChange?.(getTransformerByID(transformID));
  };

  _onToggle = () => {
    if (this.props.transformer !== undefined) {
      this.props.onTransformChange?.(null);
    }
  };

  render() {
    const category = this.props.category;
    if (category === undefined) {
      return null;
    }
    const transformers = category.transformers.filter(
      t => t.showInMenu !== false || t === this.props.transformer,
    );
    return (
      <div className={cx({
        button: true,
        menuButton: true,
        disabled: category.transformers.length === 0,
      })}>
        <button
          type="button"
          onClick={this._onToggle}
          disabled={category.transformers.length === 0}>
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-toggle-off': this.props.showTransformer !== true,
              'fa-toggle-on': this.props.showTransformer === true,
              'fa-fw': true,
            })}
          />
          &nbsp;Transform
        </button>
        {transformers.length > 0 && <ul>
          {transformers.map(transformer => (
            <li
              key={transformer.id}
              className={cx({
                selected: this.props.showTransformer === true &&
                  this.props.transformer === transformer,
              })}
              onClick={this._onClick}
              onKeyDown={this._onClick}>
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
