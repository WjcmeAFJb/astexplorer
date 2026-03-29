import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames.js';

const keyMappings = ['default', 'vim', 'emacs', 'sublime']

/**
 * @typedef {Object} KeyMapButtonProps
 * @property {(keyMap: string) => void} [onKeyMapChange]
 * @property {string} [keyMap]
 */

/** @extends {React.Component<KeyMapButtonProps>} */
class KeyMapButton extends React.Component {
  render() {
    return (
      <div className={cx({
        button: true,
        menuButton: true,
      })}>
        <button
          type="button">
          <i
            className={cx({
              fa: true,
              'fa-lg': true,
              'fa-keyboard-o': true,
            })}
          />
          &nbsp;{this.props.keyMap}
        </button>
        {<ul>
          {keyMappings.map(keyMap => (
            <li
              key={keyMap}
              // @ts-expect-error — disabled is not standard on <li> but used for styling
              disabled={this.props.keyMap === keyMap}
              onClick={() => this.props.onKeyMapChange(keyMap)}>
              <button type="button" >
                {keyMap}
              </button>
            </li>
          ))}
        </ul>}
      </div>
    );
  }
}

KeyMapButton.propTypes = {
  onKeyMapChange: PropTypes.func,
  keyMap: PropTypes.string,
}

export default KeyMapButton
