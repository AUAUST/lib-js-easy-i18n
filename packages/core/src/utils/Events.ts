import type { Locale, Translations } from "../types/config";
import type { Namespace } from "../types/translations";
import type { Translations as TranslationsClass } from "../Translations";
import type { TFunction } from "../t";

import { S } from "@auaust/primitive-kit";

export type CallbacksStore = {
  [K: string]: NonNullable<Set<(...args: unknown[]) => void>>;
};

export type TranslationsEvent = keyof TranslationsEvents;
export type TranslationsEventCallback<Event extends TranslationsEvent> =
  TranslationsEvents[Event];

/**
 * A set of events that are emitted by the `Translations` class instance.
 */
export interface TranslationsEvents {
  /**
   * Emitted every time the `t` function is updated.
   * This happens for a variety of reasons, including:
   *
   * - The instance is initialized.
   * - The locale is changed.
   * - New translations are added.
   */
  tChanged: (Translations: TranslationsClass, t: TFunction) => void;

  /**
   * Emitted when the Translations instance is initialized.
   */
  initialized: (Translations: TranslationsClass) => void;

  /**
   * Emitted when the locale is changed.
   */
  localeChanged: (
    Translations: TranslationsClass,
    newLocale: Locale,
    oldLocale: Locale,
  ) => void;

  /**
   * Emitted when new translations are loaded.
   * This event isn't emitted when the translations are passed directly to the constructor.
   * The function gets passed the translations that were loaded, and might apply some transformations to them.
   */
  translationsLoaded: (
    Translations: TranslationsClass,
    translations: Translations,
    locale: Locale,
    requestedNamespaces: Namespace[],
  ) => void;

  /**
   * Emitted when new translations are merged into the existing ones.
   * This event is emitted with any source of new translations, including the ones passed directly to the constructor.
   */
  translationsAdded: (
    Translations: TranslationsClass,
    locale: Locale,
    namespaces: Namespace[],
  ) => void;
}

export function on(
  store: CallbacksStore,
  event: string,
  callback: (...args: any[]) => void,
) {
  event = S.toLowerCase(event);

  if (!store[event]) {
    store[event] = new Set();
  }

  if (typeof callback === "function") {
    store[event]!.add(callback);

    return () => {
      return off(store, event, callback);
    };
  }

  return () => false;
}

export function off(
  store: CallbacksStore,
  event: string,
  callback?: (...args: any[]) => void,
) {
  event = S.toLowerCase(event);

  // If no callback is passed, clear the entire event store.
  if (callback === undefined) {
    return delete store[event];
  }

  const eventStore = store[event];

  return eventStore ? eventStore.delete(callback) : false;
}

export function emit(store: CallbacksStore, event: string, args: any[]) {
  event = S.toLowerCase(event);

  if (store[event]) {
    for (const callback of store[event]!) {
      callback(...args);
    }
  }
}
