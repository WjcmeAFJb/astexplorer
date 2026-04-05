import PropTypes from 'prop-types';
import * as React from 'react';
import cx from '../utils/classnames';

const baseStyle: Record<string, string> = {
  flex: '1',
  display: 'flex',
};

const styleB = {
  ...baseStyle,
  minWidth: 0,
  minHeight: 0,
};

type SplitPaneProps = {
  vertical?: boolean;
  className?: string;
  children?: React.ReactNode;
  onResize?: () => void;
};

/**

 * Creates a left-right split pane inside its container.
 */
export default function SplitPane({vertical, className, children, onResize}: SplitPaneProps): React.ReactElement {
  // Position is really the size (width or height) of the first (left or top)
  // panel, as percentage of the parent containers size. The remaining elements
  // are sized and layed out through flexbox.
  const [position, setPosition] = React.useState(50)
  const container = React.useRef((null as HTMLDivElement | null))

  const onMouseDown = React.useCallback( function(event: React.MouseEvent<HTMLDivElement>) {
    if (container.current === null) {
      return;
    }

    // This is needed to prevent text selection in Safari
    event.preventDefault();

    const offset = vertical === true ? container.current.offsetTop : container.current.offsetLeft;
    const size = vertical === true ? container.current.offsetHeight : container.current.offsetWidth;
    document.body.style.cursor = vertical === true ? 'row-resize' : 'col-resize';
    let moveHandler = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      const newPosition = ((vertical === true ? moveEvent.pageY : moveEvent.pageX) - offset) / size * 100;
      // Using 99% as the max value prevents the divider from disappearing
      setPosition(Math.min(Math.max(0, newPosition), 99));
    };
    let upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
      document.body.style.cursor = '';

      if (onResize !== undefined) {
        onResize();
      }
    };

    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }, [vertical, onResize, container])

  const childArray = React.Children.toArray(children)

  if (childArray.length < 2) {
    return (
      <div className={className} style={{display: 'flex'}}>
        {childArray}
      </div>
    );
  }

  const styleA = {...baseStyle};

  if (vertical === true) {
    // top
    styleA.minHeight = styleA.maxHeight = position + '%'
  } else {
    // left
    styleA.minWidth = styleA.maxWidth = position + '%'
  }

  return (
    <div
      ref={container}
      className={className}
      style={{display: 'flex', flexDirection: vertical === true ? 'column' : 'row'}}>
      <div style={styleA}>
        {childArray[0]}
      </div>
      <div
        role="separator"
        className={cx({
          'splitpane-divider': true,
          vertical: vertical === true,
          horizontal: vertical !== true,
        })}
        onMouseDown={onMouseDown}
      />
      <div style={styleB}>
        {childArray[1]}
      </div>
    </div>
  );
}

SplitPane.propTypes = {
  vertical: PropTypes.bool,
  className: PropTypes.string,
  children: PropTypes.node,
  onResize: PropTypes.func,
};
