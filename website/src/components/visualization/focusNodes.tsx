/**
 * This may be a horrible way to do it, but this function is called from React
 * components to "collect" all elements that represent AST nodes that are
 * currently "focused", i.e. the position of the caret corresponds with this
 * node.
 * Since a node can appear multiple times in the parser output, multiple elements
 * can be highlighted. The question is: which element should we scroll to?
 * My current answer: The one that is closest to the vertical center of the
 * view.
 * React components cannot solve this themselves since they don't have knowledge
 * over other elements.
 * So this function works as follows:
 *   - At render, the tree root initializes a new set of nodes.
 *   - Whenever a child node is rendered and "in focus", it adds a ref to the
 *     list of elements.
 *   - After render, the tree root triggers the focus logic. The element that is
 *     closest to the center is scrolled into the view.
 */
let nodes: Set<React.RefObject<HTMLElement>>;

export default function(message: 'init' | 'add' | 'focus', arg?: React.RefObject<HTMLElement>) {
  switch (message) {
    case 'init':
      nodes = new Set();
      break;
    case 'add':
      if (arg !== undefined) {
        nodes.add(arg);
      }
      break;
    case 'focus': {
      if (arg === undefined) {
        break;
      }
      const root = arg.current;
      if (root === null || root === undefined) {
        break;
      }
      const size = nodes.size;
      try {
        if (size === 1) {
          const [firstRef] = nodes;
          if (firstRef !== undefined && firstRef.current !== null && firstRef.current !== undefined) {
            firstRef.current.scrollIntoView();
          }
        } else if (size > 1) {
          const rootRect = root.getBoundingClientRect();
          const center = (rootRect.y + rootRect.height) / 2 + rootRect.y;
          let closest: [HTMLElement, number] | null = null;
          for (const ref of nodes) {
            if (ref.current === null || ref.current === undefined) {
              continue;
            }
            const elementRect = ref.current.getBoundingClientRect();
            const distance = elementRect.y - center;
            const minDistance = Math.min(
              Math.abs(distance),
              Math.abs(distance + elementRect.height),
            );

            if (closest === null || closest[1] > minDistance) {
              closest = [ref.current, minDistance];
            }
          }
          if (closest !== null) {
            closest[0].scrollIntoView();
          }
        }
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error('Unable to scroll node into view:', error.message);
      }

    }
  }
}
