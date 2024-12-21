import { F, S } from "@auaust/primitive-kit";

export type CallbacksStore<Events extends EventsConfig = EventsConfig> = {
  [K in keyof Events]?: Set<Events[K]>;
};

export type EventsConfig = Record<string, (...args: any[]) => void>;

export class HasEvents<Events extends EventsConfig = EventsConfig> {
  /** @internal */
  private listeners: CallbacksStore<Events>;

  constructor() {
    this.listeners = {};
  }

  /**
   * Adds a listener for the given event.
   * Returns a function that can be called to remove the listener.
   */
  public on<E extends keyof Events>(
    event: E,
    callback: Events[E],
  ): () => boolean {
    // @ts-expect-error
    event = S.toLowerCase(event);

    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }

    if (F.is(callback)) {
      this.listeners[event]!.add(callback);

      return () => this.off(event, callback);
    }

    return () => false;
  }

  /**
   * Removes the listener from the given event.
   * If no callback is provided, all listeners for the given event are removed.
   */
  public off<E extends keyof Events>(event: E, callback?: Events[E]): boolean {
    // @ts-expect-error
    event = S.toLowerCase(event);

    // If no callback is passed, clear the entire event store.
    if (callback === undefined) {
      return delete this.listeners[event];
    }

    return this.listeners[event]?.delete(callback) ?? false;
  }

  /**
   * Emits the given event with the provided arguments.
   */
  public emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ) {
    // @ts-expect-error
    event = S.toLowerCase(event);

    if (this.listeners[event]) {
      for (const callback of this.listeners[event]!) {
        callback(...args);
      }
    }
  }
}
