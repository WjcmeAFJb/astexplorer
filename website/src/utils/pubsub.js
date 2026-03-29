/** @type {Record<string, Array<(data: unknown) => void>>} */
const subscribers = {};

/**
 * @param {string} topic
 * @param {(data: unknown) => void} handler
 * @returns {() => void}
 */
export function subscribe(topic, handler) {
  let handlers = subscribers[topic];
  if (!handlers) {
    handlers = subscribers[topic] = [];
  }
  if (handlers.indexOf(handler) === -1) {
    handlers.push(handler);
  }

  return () => handlers.splice(handlers.indexOf(handler), 1);
}

/**
 * @param {string} topic
 * @param {unknown} [data]
 * @returns {void}
 */
export function publish(topic, data) {
  if (subscribers[topic]) {
    setTimeout(function callSubscribers() {
      if (subscribers[topic]) {
        const handlers = subscribers[topic];
        for (var i = 0; i < handlers.length; i++) {
          handlers[i](data);
        }
      }
    }, 0);
  }
}

/**
 * @param {Array<() => void>} unsubscribers
 * @returns {void}
 */
export function clear(unsubscribers) {
  unsubscribers.forEach(call);
}

/**
 * @param {() => void} f
 * @returns {void}
 */
function call(f) {
  return f();
}
