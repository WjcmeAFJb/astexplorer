/** @typedef {MessageEvent<{type: string, action: string, value: unknown, requestId: number}>} WorkerMessageEvent */

// Some ESLint rules don't understand the Webpack loader syntax.
// eslint-disable-next-line require-in-package/require-in-package, import/default
import HermesWorker from 'worker-loader!./hermes-worker.js';

// A Promise-based client for making requests to hermes-worker.js.
export default class HermesWorkerClient {
  constructor() {
    this._nextRequestId = 0;
    /** @type {Map<number, {resolve: (value: unknown) => void, reject: (reason: unknown) => void}>} */
    this._requests = new Map();
    this._worker = new HermesWorker();
    // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
    this._worker.onmessage = this._handleMessage.bind(this);
  }

  _handleMessage(e: WorkerMessageEvent) {
    const {type, action, value, requestId} = e.data;
    const request = this._requests.get(requestId);
    if (!request) {
      throw new Error(
        `Received a response for a nonexistent '${type}' request ID: ${requestId}`,
      );
    }
    this._requests.delete(requestId);
    switch (action) {
      case 'resolve':
        request.resolve(value);
        break;
      case 'reject':
        // The worker sends errors as plain objects to work around the
        // limitations of the structured clone algorithm.
        request.reject(Object.assign(new Error(), value));
        break;
    }
  }

  _request(type: string, args: unknown[]) {
    return new Promise((resolve, reject) => {
      const requestId = this._nextRequestId++;
      this._requests.set(requestId, {resolve, reject});
      this._worker.postMessage({type, args, requestId});
    });
  }

  /** @param {...unknown} args */
  parse(...args) {
    return this._request('parse', args);
  }
}
