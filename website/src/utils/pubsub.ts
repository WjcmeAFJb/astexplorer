const subscribers: Record<string, Array<(data: unknown) => void>> = {};

export function subscribe(topic: string, handler: (data: unknown) => void): () => void {
  const handlers = subscribers[topic] ??= [];
  if (!handlers.includes(handler)) {
    handlers.push(handler);
  }

  return () => handlers.splice(handlers.indexOf(handler), 1);
}

export function publish(topic: string, data?: unknown): void {
  if (subscribers[topic] !== undefined) {
    setTimeout(function callSubscribers() {
      if (subscribers[topic] !== undefined) {
        const handlers = subscribers[topic];
        for (var i = 0; i < handlers.length; i++) {
          handlers[i](data);
        }
      }
    }, 0);
  }
}

export function clear(unsubscribers: Array<() => void>): void {
  for (const unsub of unsubscribers) {
    unsub();
  }
}
