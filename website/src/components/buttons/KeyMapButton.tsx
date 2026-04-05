// oxlint-disable jsx-a11y/click-events-have-key-events -- menu <li> elements delegate to inner <button> which provides keyboard access
import PropTypes from 'prop-types';
import React from 'react';
import cx from '../../utils/classnames';

const keyMappings = ['default', 'vim', 'emacs', 'sublime']

type KeyMapButtonProps = {
  onKeyMapChange?: (keyMap: string) => void;
  keyMap?: string;
};

class KeyMapButton extends React.Component<KeyMapButtonProps> {
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
