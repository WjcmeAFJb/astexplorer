import CompactArrayView from './CompactArrayView';
import CompactObjectView from './CompactObjectView';
import { publish } from '../../../utils/pubsub';
import React from 'react';
import { useSelectedNode } from '../SelectedNodeContext';
import focusNodes from '../focusNodes';
import type { TreeAdapter } from '../../../core/TreeAdapter';

import cx from '../../../utils/classnames';
import stringify from '../../../utils/stringify';

const { useState, useRef, useMemo, useCallback, useEffect } = React;

function usePrevious<T>(value: T, initialValue: T): T {
  const ref = useRef(initialValue);
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

/*
// For debugging
function log(f) {
  return function(a, b) {
    let result = f.call(this, a,b);
    console.log(a.name, a.name || a.value && a.value.type, 'Updates', result);
    return result;
  };
}
*/

const OPEN_STATES = {
  DEFAULT: 0,
  OPEN: 1,
  DEEP_OPEN: 2,
  FOCUS_OPEN: 3,
  CLOSED: 4,
};

const EVENTS = {
  CLICK_SELF: 0,
  CLICK_DESCENDANT: 1,
  GAIN_FOCUS: 2,
  LOOSE_FOCUS: 3,
  DEEP_OPEN: 4,
};

function transition(currentState: number, event: number): number {
  switch (currentState) {
    case OPEN_STATES.DEFAULT:
    case OPEN_STATES.CLOSED:
      switch (event) {
        case EVENTS.DEEP_OPEN:
          return OPEN_STATES.DEEP_OPEN;
        case EVENTS.GAIN_FOCUS:
          return OPEN_STATES.FOCUS_OPEN;
        case EVENTS.LOOSE_FOCUS:
          return OPEN_STATES.DEFAULT;
      }
      break;

    case OPEN_STATES.OPEN:
      switch (event) {
        case EVENTS.DEEP_OPEN:
          return OPEN_STATES.DEEP_OPEN;
        case EVENTS.GAIN_FOCUS:
        case EVENTS.LOOSE_FOCUS:
          return currentState;
      }
      break;

    case OPEN_STATES.DEEP_OPEN:
      return OPEN_STATES.DEEP_OPEN;

    case OPEN_STATES.FOCUS_OPEN:
      switch (event) {
        case EVENTS.GAIN_FOCUS:
          return OPEN_STATES.FOCUS_OPEN;
        case EVENTS.LOOSE_FOCUS:
          return OPEN_STATES.DEFAULT;
        case EVENTS.DEEP_OPEN:
          return OPEN_STATES.DEEP_OPEN;
      }
      break;
  }
  return currentState;
}

function useOpenState(
  openFromParent: boolean,
  isInRange: boolean,
): [number, React.Dispatch<React.SetStateAction<number>>] {
  const previousOpenFromParent = usePrevious(openFromParent, false);
  const wasInRange = usePrevious(isInRange, false);
  const [ownOpenState, setOwnOpenState] = useState(OPEN_STATES.DEFAULT);
  const previousOwnOpenState = usePrevious(ownOpenState, OPEN_STATES.DEFAULT);
  const previousComputedOpenState = useRef(OPEN_STATES.DEFAULT);
  let computedOpenState = previousComputedOpenState.current;

  if (ownOpenState !== previousOwnOpenState) {
    computedOpenState = ownOpenState;
  } else if (wasInRange !== isInRange) {
    computedOpenState = transition(
      previousComputedOpenState.current,
      isInRange && !wasInRange ? EVENTS.GAIN_FOCUS : EVENTS.LOOSE_FOCUS,
    );
    if (!isInRange && wasInRange && ownOpenState === OPEN_STATES.CLOSED) {
      setOwnOpenState(OPEN_STATES.DEFAULT);
    }
  } else if (openFromParent && !previousOpenFromParent) {
    computedOpenState = transition(previousComputedOpenState.current, EVENTS.DEEP_OPEN);
  }

  useEffect(() => {
    previousComputedOpenState.current = computedOpenState;
  });

  return [computedOpenState, setOwnOpenState];
}

type ElementProps = {
  name?: string;
  value?: unknown;
  computed?: boolean;
  open?: boolean;
  level?: number;
  treeAdapter?: TreeAdapter;
  autofocus?: boolean;
  parent?: unknown;
  isInRange?: boolean;
  hasChildrenInRange?: boolean;
  selected?: boolean;
  onClick?: (state: number, own?: boolean) => void;
  position?: number;
};

const Element = React.memo(
  function Element({
    name = '',
    value,
    computed,
    open = false,
    level = 0,
    treeAdapter,
    autofocus,
    isInRange,
    hasChildrenInRange,
    selected,
    onClick,
    position,
  }: ElementProps) {
    if (!treeAdapter) {
      throw new Error('Element requires a treeAdapter prop');
    }
    const opensByDefault =
      useMemo(() => treeAdapter.opensByDefault(value, name), [treeAdapter, value, name]) ||
      level === 0;
    const [openState, setOpenState] = useOpenState(
      open,
      autofocus === true && (isInRange === true || hasChildrenInRange === true),
    );
    const element = useRef<HTMLLIElement | null>(null);
    if (autofocus === true && isInRange === true && hasChildrenInRange !== true) {
      focusNodes('add', element);
    }

    const isOpen =
      openState === OPEN_STATES.DEFAULT ? opensByDefault : openState !== OPEN_STATES.CLOSED;

    const onToggleClick = useCallback(
      (event: React.MouseEvent | React.KeyboardEvent) => {
        const shiftKey = event.shiftKey;
        const newOpenState = shiftKey
          ? OPEN_STATES.DEEP_OPEN
          : isOpen
            ? OPEN_STATES.CLOSED
            : OPEN_STATES.OPEN;
        if (onClick) {
          onClick(newOpenState, true);
        }
        setOpenState(newOpenState);
      },
      [onClick, isOpen, setOpenState],
    );

    const range = treeAdapter.getRange(value);
    let onMouseOver: ((event: React.SyntheticEvent) => void) | undefined;
    let onMouseLeave: ((event: React.MouseEvent) => void) | undefined;

    // enable highlight on hover if node has a range
    if (range && level !== 0) {
      onMouseOver = (event: React.SyntheticEvent) => {
        event.stopPropagation();
        publish('HIGHLIGHT', { node: value, range });
      };

      onMouseLeave = (event: React.MouseEvent) => {
        event.stopPropagation();
        publish('CLEAR_HIGHLIGHT', { node: value, range });
      };
    }

    const clickHandler = useCallback(() => {
      setOpenState(OPEN_STATES.OPEN);
      if (onClick) {
        onClick(OPEN_STATES.OPEN);
      }
    }, [onClick, setOpenState]);

    const renderChild = (
      childKey: string,
      childValue: unknown,
      childParent: unknown,
      childName: string | undefined,
      childComputed: boolean,
    ) => {
      if (
        treeAdapter.isArray(childValue) ||
        treeAdapter.isObject(childValue) ||
        typeof childValue === 'function'
      ) {
        const ElementType = typeof childValue === 'function' ? FunctionElement : ElementContainer;
        return (
          <ElementType
            key={childKey}
            name={childName}
            open={openState === OPEN_STATES.DEEP_OPEN}
            value={childValue}
            computed={childComputed}
            level={level + 1}
            treeAdapter={treeAdapter}
            autofocus={autofocus}
            parent={childParent}
            onClick={clickHandler}
            position={position}
          />
        );
      }
      return (
        <PrimitiveElement
          key={childKey}
          name={childName}
          value={childValue}
          computed={childComputed}
        />
      );
    };

    let valueOutput = null;
    let content = null;
    let prefix = null;
    let suffix = null;
    let showToggler = false;

    if (value !== undefined && value !== null && typeof value === 'object') {
      // Render a useful name for object like nodes
      if (!treeAdapter.isArray(value)) {
        const nodeName = treeAdapter.getNodeName(value);
        if (nodeName) {
          valueOutput = (
            <button type="button" className="tokenName nc" tabIndex={0} onClick={onToggleClick}>
              {nodeName}{' '}
              {selected === true ? (
                <span className="ge" style={{ fontSize: '0.8em' }}>
                  {' = $node'}
                </span>
              ) : null}
            </button>
          );
        }
      }

      // @ts-expect-error — value is narrowed to object but .length check is runtime duck-typing for array-like
      if (typeof value.length === 'number') {
        // @ts-expect-error — value.length access after typeof guard
        if (value.length > 0 && isOpen) {
          prefix = '[';
          suffix = ']';
          const node = value;
          let elements = Array.from(treeAdapter.walkNode(value))
            .filter(({ key: k }) => k !== 'length')
            .map(({ key: childKey, value: childValue, computed: childComputed }) =>
              renderChild(
                childKey,
                childValue,
                node,
                Number.isInteger(+childKey) ? undefined : childKey,
                childComputed,
              ),
            );
          content = <ul className="value-body">{elements}</ul>;
        } else {
          valueOutput = (
            <span>
              {valueOutput}
              <CompactArrayView
                array={Array.isArray(value) ? value : undefined}
                onClick={onToggleClick}
              />
            </span>
          );
        }
        // @ts-expect-error — value.length access after typeof guard
        showToggler = value.length > 0;
      } else if (isOpen) {
        prefix = '{';
        suffix = '}';
        const node = value;
        let elements = Array.from(treeAdapter.walkNode(value)).map(
          ({ key: childKey, value: childValue, computed: childComputed }) =>
            renderChild(childKey, childValue, node, childKey, childComputed),
        );
        content = <ul className="value-body">{elements}</ul>;
        showToggler = elements.length > 0;
      } else {
        let keys = Array.from(treeAdapter.walkNode(value), ({ key }) => key);
        valueOutput = (
          <span>
            {valueOutput}
            <CompactObjectView onClick={onToggleClick} keys={keys} />
          </span>
        );
        showToggler = keys.length > 0;
      }
    }

    let classNames = cx({
      entry: true,
      highlighted:
        (isInRange === true && (hasChildrenInRange !== true || !isOpen)) ||
        (isInRange !== true && hasChildrenInRange === true && !isOpen),
      toggable: showToggler,
      open: isOpen,
    });
    return (
      <li
        ref={element}
        className={classNames}
        onMouseOver={onMouseOver}
        onFocus={onMouseOver}
        onMouseLeave={onMouseLeave}
      >
        {name !== undefined && name !== '' ? (
          <PropertyName name={name} computed={computed} onClick={onToggleClick} />
        ) : undefined}
        <span className="value">{valueOutput}</span>
        {prefix !== null && prefix !== '' ? (
          <span className="prefix p">&nbsp;{prefix}</span>
        ) : undefined}
        {content}
        {suffix !== null && suffix !== '' ? <div className="suffix p">{suffix}</div> : undefined}
      </li>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.name === nextProps.name &&
      prevProps.value === nextProps.value &&
      prevProps.computed === nextProps.computed &&
      prevProps.open === nextProps.open &&
      prevProps.level === nextProps.level &&
      prevProps.treeAdapter === nextProps.treeAdapter &&
      prevProps.autofocus === nextProps.autofocus &&
      prevProps.selected === nextProps.selected &&
      prevProps.onClick === nextProps.onClick &&
      prevProps.isInRange === nextProps.isInRange &&
      prevProps.hasChildrenInRange === nextProps.hasChildrenInRange &&
      //
      // @ts-expect-error — hashChildrenInRange is a typo for hasChildrenInRange in original code; kept as-is
      (nextProps.isInRange === true || nextProps.hashChildrenInRange === true) &&
      prevProps.position === nextProps.position
    );
  },
);

const NOT_COMPUTED = {};

const FunctionElement = React.memo(function FunctionElement(props: ElementProps) {
  const [computedValue, setComputedValue] = useState<unknown>(NOT_COMPUTED);
  const [error, setError] = useState(null as Error | null);
  const { name, value, parent, computed, treeAdapter } = props;
  const level = props.level ?? 0;

  if (!treeAdapter) {
    throw new Error('FunctionElement requires a treeAdapter prop');
  }

  if (computedValue !== NOT_COMPUTED) {
    if (treeAdapter.isArray(computedValue) || treeAdapter.isObject(computedValue)) {
      return <ElementContainer {...props} value={computedValue} level={level + 1} />;
    }
    return <PrimitiveElement name={name} value={computedValue} computed={computed} />;
  }

  return (
    <li className="entry">
      {name !== undefined && name !== '' ? (
        <PropertyName name={name} computed={computed} />
      ) : undefined}
      <span className="value">
        <button
          type="button"
          className="ge invokeable"
          tabIndex={0}
          title="Click to invoke function"
          onClick={() => {
            try {
              if (typeof value !== 'function') return;
              const result: unknown = value.call(parent);
              console.log(result); // eslint-disable-line no-console
              setComputedValue(result);
            } catch (err) {
              const caughtError = err instanceof Error ? err : new Error(String(err));
              console.error(`Unable to run "${name}": `, caughtError.message); // eslint-disable-line no-console
              setError(caughtError);
            }
          }}
        >
          (...)
        </button>
      </span>
      {error ? (
        <span>
          {' '}
          <i title={error.message} className="fa fa-exclamation-triangle" />
        </span>
      ) : undefined}
    </li>
  );
});

type PrimitiveElementProps = {
  name?: string;
  value?: unknown;
  computed?: boolean;
};

const PrimitiveElement = React.memo(function PrimitiveElement({
  name,
  value,
  computed,
}: PrimitiveElementProps) {
  return (
    <li className="entry">
      {name !== undefined && name !== '' ? (
        <PropertyName name={name} computed={computed} />
      ) : undefined}
      <span className="value">
        <span className="s">{stringify(value)}</span>
      </span>
    </li>
  );
});

type PropertyNameProps = {
  name?: string;
  computed?: boolean;
  onClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;
};

const PropertyName = React.memo(function PropertyName({
  name,
  computed,
  onClick,
}: PropertyNameProps) {
  return (
    <span className="key">
      <button type="button" className="name nb" tabIndex={0} onClick={onClick}>
        {computed === true ? <span title="computed">*{name}</span> : name}
      </button>
      <span className="p">:&nbsp;</span>
    </span>
  );
});

export default function ElementContainer(props: ElementProps): React.ReactElement {
  const [selected, setSelected] = useState(false);
  const setSelectedNode = useSelectedNode();
  const { treeAdapter } = props;
  if (!treeAdapter) {
    throw new Error('ElementContainer requires a treeAdapter prop');
  }
  const name = props.name ?? '';
  const position = props.position ?? 0;
  const isInRange = treeAdapter.isInRange(props.value, name, position);
  const propValue = props.value;
  const propOnClick = props.onClick;
  const onClick = useCallback(
    (state: number, own: boolean | undefined) => {
      if (own === true) {
        if (state === OPEN_STATES.CLOSED) {
          setSelectedNode(null);
          setSelected(false);
        } else {
          setSelectedNode(propValue, () => setSelected(false));
          setSelected(true);
        }
      }
      if (propOnClick !== undefined) {
        propOnClick(state);
      }
    },
    [propValue, propOnClick, setSelectedNode],
  );

  return (
    <Element
      {...props}
      selected={selected}
      hasChildrenInRange={treeAdapter.hasChildrenInRange(props.value, name, position)}
      isInRange={isInRange}
      onClick={onClick}
    />
  );
}
