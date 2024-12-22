import type { Translations } from "~/classes/Translations";
import type { Locale } from "~/types/config";

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
};
