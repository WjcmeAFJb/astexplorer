/* eslint-env worker */

// A Web Worker that wraps methods from the hermes-parser package behind a
// minimal request/response protocol.

import * as hermesParser from 'hermes-parser';

/** @type {Record<string, (...args: unknown[]) => unknown>} */
const handlers = {
  parse(/** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return /** @type {unknown} */ (hermesParser.parse(code, options));
  },
};

onmessage = async function(/** @type {MessageEvent<{type: string, requestId: string, args?: unknown[]}>} */ e) {
  const {type, requestId, args = []} = e.data;
  /** @type {(...args: unknown[]) => unknown} */
  let handler = () => {
    throw new Error('No handler in Hermes worker for message type: ' + type);
  };
  if (Object.hasOwnProperty.call(handlers, type)) {
    handler = /** @type {(...args: unknown[]) => unknown} */ (handlers[type]);
  }
  let value;
  try {
    value = handler(...args);
  } catch (e) {
    postMessage({
      type,
      requestId,
      action: 'reject',
      // Errors don't survive the structured clone algorithm very well across
      // browsers - they're either not allowed or lose some of their properties.
      // Send a plain-object copy to be reconstituted by the client.
      // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- spreading Error produces any properties
      value: {name: /** @type {Error} */ (e).name, stack: /** @type {Error} */ (e).stack, message: /** @type {Error} */ (e).message, .../** @type {Error} */ (e)},
    });
    return;
  }
  postMessage({type, requestId, action: 'resolve', value});
};
