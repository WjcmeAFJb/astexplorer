import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames.js';

/**
 * @param {Object} props
 * @param {() => void} [props.toggleFormatting]
 * @param {boolean} [props.enableFormatting]
 * @returns {React.ReactElement}
 */
export default function PrettierButton(props) {
  return (<button type="button"
            className="toggleBtn"
            onClick={props.toggleFormatting}>
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-toggle-off': !props.enableFormatting,
              'fa-toggle-on': props.enableFormatting,
              'fa-fw': true,
            })}
          />
          <span className="btnText">Prettier</span>
      </button>);
}

PrettierButton.propTypes = {
  toggleFormatting: PropTypes.func,
  enableFormatting: PropTypes.bool,
}
