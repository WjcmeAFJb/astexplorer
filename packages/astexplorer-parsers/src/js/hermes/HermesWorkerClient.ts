type WorkerMessageEvent = MessageEvent<{type: string, action: string, value: unknown, requestId: number}>;

let HermesWorker: (new () => Worker) | null = null;
try {
  // Some ESLint rules don't understand the Webpack loader syntax.
  // eslint-disable-next-line require-in-package/require-in-package, import/default
  const mod = require('worker-loader!./hermes-worker.ts');
  const Ctor = mod && (mod.default || mod);
  if (typeof Ctor === 'function') {
    HermesWorker = Ctor;
  }
} catch (e) {
  // worker-loader not available
}

// A Promise-based client for making requests to hermes-worker.js.
// Falls back to main-thread parsing when worker-loader is not available.
export default class HermesWorkerClient {
  _nextRequestId: number = 0;
  _requests: Map<number, {resolve: (value: unknown) => void, reject: (reason: unknown) => void}> = new Map();
  _worker: Worker | null = null;
  _hermesParser: { parse: (code: string, options: Record<string, unknown>) => unknown } | null = null;

  constructor() {
    this._nextRequestId = 0;
    this._requests = new Map();
    if (HermesWorker) {
      this._worker = new HermesWorker();
      // oxlint-disable-next-line typescript-eslint(no-unsafe-assignment) -- .bind() returns any; TS limitation
      this._worker.onmessage = this._handleMessage.bind(this);
    }
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
    if (this._worker) {
      return new Promise((resolve, reject) => {
        const requestId = this._nextRequestId++;
        this._requests.set(requestId, {resolve, reject});
        this._worker!.postMessage({type, args, requestId});
      });
    }
    // Fallback: run in main thread
    return this._mainThreadRequest(type, args);
  }

  async _mainThreadRequest(type: string, args: unknown[]) {
    if (!this._hermesParser) {
      this._hermesParser = await new Promise((resolve) => {
        require(['hermes-parser'], (mod: any) => resolve(mod));
      });
    }
    if (type === 'parse' && this._hermesParser) {
      return this._hermesParser.parse(args[0] as string, args[1] as Record<string, unknown>);
    }
    throw new Error('Unknown hermes request type: ' + type);
  }

  parse(...args: unknown[]) {
    return this._request('parse', args);
  }
}
