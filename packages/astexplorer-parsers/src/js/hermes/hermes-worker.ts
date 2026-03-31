/* eslint-env worker */

// A Web Worker that wraps methods from the hermes-parser package behind a
// minimal request/response protocol.

// @ts-expect-error — no declaration file
import * as hermesParser from 'hermes-parser';

const handlers: Record<string, (...args: unknown[]) => unknown> = {
  parse(code: string, options: Record<string, unknown>) {
    return (hermesParser.parse(code, options) as unknown);
  },
};

onmessage = async function(e: MessageEvent<{type: string, requestId: string, args?: unknown[]}>) {
  const {type, requestId, args = []} = e.data;
    let handler: (...args: unknown[]) => unknown = () => {
    throw new Error('No handler in Hermes worker for message type: ' + type);
  };
  if (Object.hasOwnProperty.call(handlers, type)) {
    handler = (handlers[type] as (...args: unknown[]) => unknown);
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
      value: {name: (e as Error).name, stack: (e as Error).stack, message: (e as Error).message, ...(e as Error)},
    });
    return;
  }
  postMessage({type, requestId, action: 'resolve', value});
};
