import type { Translations } from "~/classes/Translations.js";
import type { Locale, TranslationsSchema } from "~/types/config.js";
import type { Namespace } from "~/types/translations.js";
import type { TFunction } from "~/utils/t.js";

/**
 * A set of events that are emitted by the `Translations` class instance.
 */
export type TranslationsEvents = {
  /**
   * Emitted every time the `t` function is updated.
   * This happens for a variety of reasons, including:
   *
   * - The instance is initialized.
   * - The locale is changed.
   * - New translations are added.
   */
  tChanged: (Translations: Translations, t: TFunction) => void;

  /**
   * Emitted when the Translations instance is initialized.
   */
  initialized: (Translations: Translations) => void;

  /**
   * Emitted when the locale is changed.
   */
  localeChanged: (
    Translations: Translations,
    newLocale: Locale,
    oldLocale: Locale,
  ) => void;

  /**
   * Emitted when new translations are loaded.
   * This event isn't emitted when the translations are passed directly to the constructor.
   * The function gets passed the translations that were loaded, and might apply some transformations to them.
   */
  translationsLoaded: (
    Translations: Translations,
    translations: TranslationsSchema,
    locale: Locale,
    requestedNamespaces: Namespace[],
  ) => void;

  /**
   * Emitted when new translations are merged into the existing ones.
   * This event is emitted with any source of new translations, including the ones passed directly to the constructor.
   */
  translationsAdded: (
    Translations: Translations,
    locale: Locale,
    namespaces: Namespace[],
  ) => void;
};
