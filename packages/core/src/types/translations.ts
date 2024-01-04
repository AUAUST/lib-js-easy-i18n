import type { NestedRecord } from "~/types/utils";
import type { Translations, Locale } from "./config";

// TRANSLATION OBJECTS-RELATED TYPES

/** A generic translation object. It is unaware of the user-provided namespaces. */
export type NestedTranslationsRecord = NestedRecord<string, Translation>;

/** An object with all namespaces and their translations. */
export type NamespacedTranslations = {
  [N in Namespace]: TranslationsForNamespace<N>;
};

/** A partial object of namespaces and their translations. */
export type PartialNamespacedTranslations = Partial<NamespacedTranslations>;

/** A generic object of namespaces and their translations. */
export type GenericNamespacedTranslations = Record<
  string,
  NestedTranslationsRecord
>;

/** A translation object for a specific namespace. */
export type TranslationsForNamespace<N extends keyof Translations> =
  Translations[N];

/** The global translation object. It's a record of locales to their namespaced translations. */
export type TranslationsStore = Record<Locale, NamespacedTranslations>;

/** A partial global translation object. */
export type PartialTranslationsStore = Partial<
  Record<Locale, PartialNamespacedTranslations>
>;

// NAMESPACES-RELATED TYPES

/** A namespace is a string that identifies a group of translations. */
export type Namespace = keyof Translations;

// SINGLE TRANSLATION-RELATED TYPES

/** A value that can be used as a translation. */
export type Translation = string | number | ((args: any) => string);

// LOCALES-RELATED TYPES

export interface LocaleDefinition {
  locale: Locale;
  name: string;
  fallback: false | Locale[];
}

export type LocaleDefinitionInit =
  | Locale
  | {
      /**
       * The locale's identifier.
       */
      locale: Locale;

      /**
       * The locale's name.
       * Would likely be set to the locale's name in its own language.
       */
      name?: string;

      /**
       * The fallback locales used to lookup missing translations.
       * If `Locale[]`, will lookup the passed locale in order.
       * If `true`, will loop through all the locales and return the first value that's found.
       * If `false`, no fallback logic will be applied.
       *
       * @default true
       */
      fallback?: boolean | Locale | Locale[];
    };
