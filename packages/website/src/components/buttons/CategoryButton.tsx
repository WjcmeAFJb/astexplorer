import React from 'react';
import cx from '../../utils/classnames';
import { getCategoryByID, categories } from 'astexplorer-parsers';
import type { Category } from '../../types';

const categoryIcon: Record<string, string> = {
  'text/x-scala': 'icon-scala',
  css: 'fa-css3',
  graphql: 'icon-GraphQL_Logo',
  handlebars: 'icon-handlebars',
  htmlmixed: 'fa-html5',
  icu: 'icon-icu',
  java: 'icon-java',
  javascript: 'fa-jsfiddle',
  ocaml: 'icon-ocaml',
  reason: 'icon-reason',
  rust: 'icon-rust',
  sql: 'fa-database',
  webidl: 'fa-th-list',
  yaml: 'fa-yc',
};

type CategoryButtonProps = {
  onCategoryChange?: (category: Category) => void;
  category?: Category;
};

export default class CategoryButton extends React.Component<CategoryButtonProps> {
  static displayName = 'CategoryButton';
  _onClick = ({ currentTarget }: { currentTarget: HTMLElement }) => {
    const categoryID = currentTarget.dataset.id;
    if (categoryID !== undefined && categoryID !== '' && this.props.onCategoryChange) {
      this.props.onCategoryChange(getCategoryByID(categoryID));
    }
  };

  render() {
    const { category } = this.props;
    return (
      <div className="button menuButton categoryButton">
        <span>
          <i
            className={cx(category ? categoryIcon[category.id] || 'fa-file-o' : 'fa-file-o', {
              fa: true,
              'fa-lg': true,
              'fa-fw': true,
            })}
          />
          &nbsp;{category ? category.displayName : ''}
        </span>
        <ul>
          {categories.map((cat) => (
            <li key={cat.id} onClick={this._onClick} onKeyDown={this._onClick} data-id={cat.id}>
              <button type="button">
                <i
                  className={cx(categoryIcon[cat.id] || 'fa-file-o', {
                    fa: true,
                    'fa-fw': true,
                  })}
                />
                &nbsp;{cat.displayName}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
