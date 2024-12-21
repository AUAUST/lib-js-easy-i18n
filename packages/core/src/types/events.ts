import type { Translations } from "~/classes/Translations";
import type { Locale, TranslationsSchema } from "~/types/config";
import type { Namespace } from "~/types/translations";

/** A set of events that are emitted by the `Translations` class instance. */
export type TranslationsEvents = {
  /** Emitted when the Translations instance is initialized. */
  initialized: (Translations: Translations) => void;

  /** Emitted when the locale is changed. */
  locale_updated: (
    Translations: Translations,
    newLocale: Locale,
    oldLocale: Locale,
  ) => void;

  /**
   * Emitted when new translations are loaded.
   * This event isn't emitted when the translations are passed directly to the constructor.
   * The function gets passed the translations that were loaded, and might apply some transformations to them.
   */
  translations_loaded: (
    Translations: Translations,
    translations: TranslationsSchema,
    locale: Locale,
    requestedNamespaces: Namespace[],
  ) => void;

  /**
   * Emitted when new translations are merged into the existing ones.
   * This event is emitted with any source of new translations, including the ones passed directly to the constructor.
   */
  translations_added: (
    Translations: Translations,
    locale: Locale,
    namespaces: Namespace[],
  ) => void;
};
