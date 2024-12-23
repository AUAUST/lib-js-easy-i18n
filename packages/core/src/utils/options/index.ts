// This file provides types used by the `Translations` class.

import type { KeysSeparator, Locale, NamespaceSeparator } from "~/types/config";
import type {
  Namespace,
  NamespacedTranslations,
  NestedTranslationsRecord,
} from "~/types/translations";
import {
  getInvalidKeysOptions,
  type NotFoundKeysOptions,
  type TooDeepKeysOptions,
} from "~/utils/options/getInvalidKeysOptions";
import {
  getLocalesOptions,
  type LocaleDefinition,
  type LocaleDefinitionInit,
} from "~/utils/options/getLocalesOptions";
import { getNamespacesOptions } from "~/utils/options/getNamespacesOptions";
import { getSyntaxOptions } from "~/utils/options/getSyntaxOptions";
import { getLoadersOptions } from "./getLoadersOptions";

/**
 * The options that can be passed to the `Translations` class constructor, with a flexible structure.
 */
export type TranslationsInit = {
  /**
   * If a single locale is used, serves to set its identifier.
   * If the `locales` option is used, serves to set the initial locale.
   */
  locale?: Locale;
  /**
   * The settings related to the locales.
   * If you only have a single locale, you can pass it as a string instead.
   */
  locales?:
    | false // No locales; creates a single locale named "default"
    | Locale // Value is the locale; no additional settings
    | (LocaleDefinitionInit | Locale)[] // Each entry is a locale; no additional settings
    | Record<Locale, string | LocaleDefinitionInit>; // Key as locale, value as name OR value as definition

  /**
   * The settings related to the namespaces.
   * If you only have a single namespace, you can pass it as a string instead.
   */
  namespaces?:
    | Namespace
    | {
        /**
         * The default namespace to lookup when a translation key doesn't specify one.
         *
         * @default "translations"
         */
        default?: Namespace;

        /**
         * A list of required namespaces.
         * This list will only be used to load the translations at initialization and locale change.
         * Any namespace can be used regardless of whether it's in this list or not.
         *
         * @default ["translations"]
         */
        required?: Namespace[];
      };

  /**
   * Allows for customizing the syntax used in the translation keys.
   */
  syntax?: {
    /**
     * The separator used to separate the namespace from the key.
     *
     * @default ":"
     */
    namespaceSeparator?: NamespaceSeparator;

    /**
     * The separator used to separate the key's segments.
     *
     * @default "."
     */
    keysSeparator?: KeysSeparator;
  };

  /**
   * Allows for customizing the way invalid keys are handled.
   */
  invalidKeys?: {
    /**
     * The way a key that's not found at all is handled.
     *
     * - `"rawKey"`: Returns the key as is, without the namespace.
     * - `"prettyKey"`: Returns the last segment of the key converted to sentence case. For example, `my.invalidKey` becomes `Invalid key`.
     * - `"empty"`: Returns an empty string.
     * - `"undefined"`: Returns `undefined`.
     *
     * @default "prettyKey"
     */
    notFound?: NotFoundKeysOptions;

    /**
     * The way a key that tries to access a translation that's "too deep".
     * For example, if `t("a.b.c")` is called, but `a.b` is already a translation string.
     * Trying to access keys that are too deep won't trigger the fallback mechanism,
     * as it's expected that all translations follow the same structure.
     *
     * - `"lastValue"`: Returns the last value that was found; i.e. the value of `a.b`.
     * - `"notFound"`: Acts as if the key was not found at all.
     *
     * @default "lastValue"
     */
    tooDeep?: TooDeepKeysOptions;
  };

  /**
   * A set of translations to use without having to load them.
   * This useful for example if you want to bundle a set of translations with your app.
   * This way, no translations will be asynchronously loaded at runtime.
   *
   * The translations must be indexed by locale and include namespaces.
   */
  translations?: Record<Locale, Partial<NamespacedTranslations>>;

  /**
   * An async function that allows to lazy load namespaces of translations.
   * It is called when the locale is switched and at initialization if no translations are provided straight away.
   *
   * Depending on your use case, `loadNamespace` might be more appropriate or simpler to implement.
   *
   * If a namespace isn't found, return `undefined` and it will be ignored.
   */
  loadNamespaces?: <Ns extends Namespace[]>(
    locale: Locale,
    namespaces: Ns,
  ) => Promise<
    | {
        [K in Ns[number]]?: NestedTranslationsRecord;
      }
    | undefined
  >;

  /**
   * An async function that allows to lazy load a single namespace of translations.
   * If possible, it's recommended to use `loadNamespaces` instead.
   *
   * If the namespace isn't found, return `undefined` and it will be ignored.
   */
  loadNamespace?: (
    locale: Locale,
    namespace: Namespace,
  ) => Promise<NestedTranslationsRecord | undefined>;
};

/** The options restructured and filled with defaults based on a `TranslationsInit` object. */
export type TranslationsOptions = {
  /** The current locale. */
  locale: Locale;

  /** A configuration for each locale. */
  locales: Record<Locale, LocaleDefinition>;

  /** The default namespace. */
  defaultNamespace: Namespace;

  /** Required namespaces for the initial load and after locale changes. */
  requiredNamespaces: Namespace[];

  /** The separator used to separate the namespace from the key. */
  namespaceSeparator: NamespaceSeparator;

  /** The separator used to separate the key's segments. */
  keysSeparator: KeysSeparator;

  /** The way a key that's not found at all is handled. */
  notFoundKeys: Lowercase<NotFoundKeysOptions>; // Lowercase to case-insensitify

  /** The way a key that tries to access a translation that's "too deep" is handled. */
  tooDeepKeys: Lowercase<TooDeepKeysOptions>; // Lowercase to case-insensitify

  /** An async function that lazily loads namespaces of translations for a locale. */
  loadNamespaces:
    | ((
        locale: Locale,
        namespaces: Namespace[],
      ) => Promise<
        | {
            [K in Namespace]?: NestedTranslationsRecord | undefined;
          }
        | undefined
      >)
    | undefined;

  /** An async function that lazily loads a single namespace of translations for a locale. */
  loadNamespace:
    | ((
        locale: Locale,
        namespace: Namespace,
      ) => Promise<NestedTranslationsRecord | undefined>)
    | undefined;
};

export function getOptions(init: TranslationsInit): TranslationsOptions {
  const options: TranslationsOptions = {
    ...getLocalesOptions(init),
    ...getNamespacesOptions(init),
    ...getSyntaxOptions(init),
    ...getInvalidKeysOptions(init),
    ...getLoadersOptions(init),
  };

  return options;
}
