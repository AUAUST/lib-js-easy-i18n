// This file provides types used by the `Translations` class.

import { A, O, S } from "@auaust/primitive-kit";

import type { Locale, TranslationsSchema } from "~/types/config";
import type {
  GenericNamespacedTranslations,
  LocaleDefinition,
  LocaleDefinitionInit,
  Namespace,
  NamespacedTranslations,
  NestedTranslationsRecord,
} from "~/types/translations";
import {
  notFoundKeysOptions,
  tooDeepKeysOptions,
  tooShallowKeysOptions,
  type NotFoundKeysOptions,
  type TooDeepKeysOptions,
  type TooShallowKeysOptions,
} from "~/utils/invalid_keys";

/**
 * The options that can be passed to the `Translations` class constructor, with a flexible structure.
 */
export interface TranslationsInit {
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
        default: Namespace;

        /**
         * A list of required namespaces.
         * This list will only be used to load the translations at initialization and locale change.
         * Any namespace can be used regardless of whether it's in this list or not.
         *
         * @default ["translations"]
         */
        initial?: Namespace[];
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
    namespaceSeparator?: string;

    /**
     * The separator used to separate the key's segments.
     *
     * @default "."
     */
    keysSeparator?: string;
  };

  /**
   * Allows for customizing the way invalid keys are handled.
   */
  invalidKeys?: {
    /**
     * The way a key that's not found at all is handled.
     *
     * - `"rawKey"`: Returns the key as is, without the namespace.
     * - `"prettyKey"`: Returns the key converted to sentence case. For example, `my.invalidKey` becomes `My invalid key`.
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

    /**
     * The way a key that doesn't lead to a final translation is handled.
     * For example, if `t("a.b")` is called but the translations are `{ a: { b: { c: "value" } } }`.
     * Trying to access keys that are too shallow won't trigger the fallback mechanism,
     * as it's expected that all translations follow the same structure.
     *
     * - `"object"`: Returns the object that was found.
     * - `"notFound"`: Acts as if the key was not found at all.
     *
     * @default "notFound"
     */
    tooShallow?: TooShallowKeysOptions;
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
}

/**
 * The options restructured and filled with defaults based on a `TranslationsInit` object.
 */
export interface TranslationsOptions {
  /**
   * The current locale.
   */
  locale: Locale;

  /**
   * The configuration for each locale.
   */
  localesDefinitions: Record<Locale, LocaleDefinition>;

  /**
   * The default namespace.
   */
  defaultNamespace: Namespace;
  /**
   * The initial namespaces and any other namespace that has been loaded.
   */
  requiredNamespaces: Namespace[];

  /**
   * The separator used to separate the namespace from the key.
   */
  namespaceSeparator: string;
  /**
   * The separator used to separate the key's segments.
   */
  keysSeparator: string;

  /**
   * The way a key that's not found at all is handled.
   */
  notFoundKeys: Lowercase<NotFoundKeysOptions>; // Lowercase to case-insensitify
  /**
   * The way a key that tries to access a translation that's "too deep" is handled.
   */
  tooDeepKeys: Lowercase<TooDeepKeysOptions>; // Lowercase to case-insensitify
  /**
   * The way a key that doesn't lead to a final translation is handled.
   */
  tooShallowKeys: Lowercase<TooShallowKeysOptions>; // Lowercase to case-insensitify

  /**
   * The translations store.
   */
  translations: Partial<Record<Locale, GenericNamespacedTranslations>>;

  /**
   * An async function that lazily loads namespaces of translations for a locale.
   */
  loadNamespaces: (
    locale: Locale,
    namespaces: Namespace[],
  ) => Promise<{
    [K in Namespace]?: NestedTranslationsRecord;
  }>;
}

export function getOptions(init: TranslationsInit): TranslationsOptions {
  const options: TranslationsOptions = {
    translations: init.translations ?? ({} as any),

    // Locale-related
    ...(() => {
      const localeInit = init.locale;
      const localesInit = init.locales;

      if (!localesInit) {
        if (localeInit) {
          return {
            locale: localeInit,
            localesDefinitions: {
              [localeInit]: localeDefinition(localeInit, false),
            },
          };
        }

        return {
          locale: "default",
          localesDefinitions: {
            default: localeDefinition("default", false),
          },
        };
      }

      if (S.is(localesInit)) {
        const locale = localesInit.toLowerCase();

        return {
          locale,
          locales: [locale],
          localesDefinitions: {
            [locale]: localeDefinition(locale, false),
          },
        };
      }

      if (A.isArray(localesInit)) {
        const definitionsInit = localesInit.map((l) => {
          if (S.is(l)) {
            return { locale: S.toLowerCase(l) };
          }

          l.locale = S.toLowerCase(l.locale);

          return l;
        });

        const locale = localeInit
          ? S.toLowerCase(localeInit)
          : definitionsInit[0]!.locale!;

        const locales = definitionsInit
          .map((l) => S.toSnakeCase(l.locale ?? l.name))
          .filter(Boolean);

        return {
          locale,
          localesDefinitions: definitionsInit.reduce(
            (acc, init) => {
              const currentLocale = init.locale
                ? S.toLowerCase(init.locale)
                : S.toSnakeCase(init.name);

              // If there's no locale nor name, locale will be an empty string. We can't have that as a key.
              if (!currentLocale) {
                throw new Error(
                  `Translations: A locale definition must include either a locale or a name.`,
                );
              }

              acc[currentLocale] = localeDefinition(
                init,
                locale !== currentLocale && locales, // will return `false` for the default locale (which can't fallback)
              );

              return acc;
            },
            {} as Record<Locale, LocaleDefinition>,
          ),
        };
      }

      const definitionsInit = O.entries(localesInit).map(([locale, init]) => {
        if (S.is(init)) {
          return { locale: S.toLowerCase(init) };
        }

        init.locale = S.toLowerCase(init.locale ?? locale); // Set the locale to the prop if present, otherwise use the key

        return init;
      });

      const locale = localeInit
        ? S.toLowerCase(localeInit)
        : definitionsInit[0]!.locale!;

      const locales = definitionsInit.map((l) => l.locale!);

      if (!locales.includes(locale)) {
        locales.unshift(locale);
      }

      return {
        locale,
        localesDefinitions: definitionsInit.reduce(
          (acc, init) => {
            const locale = init.locale!;

            acc[locale] = localeDefinition(locale, locales);

            return acc;
          },
          {} as Record<Locale, LocaleDefinition>,
        ),
      };

      // const locales =
      //   O.entries(localesInit).reduce(
      //   (acc, [locale, init]) => {
      //     acc[S.toLowerCase(locale)] = localeDefinition(init, false);

      //     return acc;
      //   },
      //   {} as Record<Locale, LocaleDefinition>,
      // );

      // const toLocale = (l: LocaleDefinitionInit) => {
      //   return S.toLowerCase(S.is(l) ? l : l.locale);
      // };

      // const locale = S.toLowerCase(localesInit.default);
      // const locales = localesInit.all
      //   ? localesInit.all.map((l) => toLocale(l))
      //   : [locale];

      // if (!locales.includes(locale)) {
      //   locales.unshift(locale);
      // }

      // const localesDefinitions: Record<Locale, LocaleDefinition> = {} as any;
      // localesInit.all
      //   ? localesInit.all.forEach((l) => {
      //       localesDefinitions[toLocale(l)] = localeDefinition(l, locales);
      //     })
      //   : locales.forEach((l) => {
      //       localesDefinitions[l] = localeDefinition(l, false);
      //     });

      // return {
      //   locale,
      //   localesDefinitions,
      // };
    })(),

    // Namespace-related
    ...(() => {
      const nsInit = init.namespaces;

      if (!nsInit) {
        return {
          defaultNamespace: "translations" as any,
          requiredNamespaces: ["translations"] as any,
        };
      }

      if (S.is(nsInit)) {
        const namespace = S.toLowerCase(nsInit);

        return {
          defaultNamespace: namespace,
          requiredNamespaces: [namespace],
        };
      }

      const defaultNamespace = S.toLowerCase(nsInit.default);
      const requiredNamespaces = (nsInit.initial ?? [nsInit.default]).map(
        (ns) => S.toLowerCase(ns),
      );

      requiredNamespaces.includes(defaultNamespace) ||
        requiredNamespaces.unshift(defaultNamespace);

      return {
        defaultNamespace,
        requiredNamespaces,
      };
    })(),

    // Syntax-related
    ...(() => {
      const syntaxInit = init.syntax ?? {};

      const namespaceSeparator = S.is(syntaxInit.namespaceSeparator)
        ? syntaxInit.namespaceSeparator
        : ":";
      const keysSeparator = S.is(syntaxInit.keysSeparator)
        ? syntaxInit.keysSeparator
        : ".";

      return {
        namespaceSeparator,
        keysSeparator,
      };
    })(),

    // Invalid keys-related
    ...(() => {
      const invalidKeysInit = init.invalidKeys ?? {};

      const notFoundKeysInit = S.toLowerCase(invalidKeysInit.notFound!);
      const notFoundKeys = notFoundKeysOptions.includes(notFoundKeysInit as any)
        ? notFoundKeysInit
        : "prettykey";

      const tooDeepKeysInit = S.toLowerCase(invalidKeysInit.tooDeep!);
      const tooDeepKeys = tooDeepKeysOptions.includes(tooDeepKeysInit as any)
        ? tooDeepKeysInit
        : "lastvalue";

      const tooShallowKeysInit = S.toLowerCase(invalidKeysInit.tooShallow!);
      const tooShallowKeys = tooShallowKeysOptions.includes(
        tooShallowKeysInit as any,
      )
        ? tooShallowKeysInit
        : "notfound";

      return {
        notFoundKeys,
        tooDeepKeys,
        tooShallowKeys,
      };
    })(),

    // Builds a function that loads namespaces, either based on the `loadNamespaces` or `loadNamespace` provided functions.

    loadNamespaces: (() => {
      // If the user provides a function that supports loading multiple namespaces at once, use it.
      // // We only ensure the return value is always an object.
      if (init.loadNamespaces) {
        const loaderFn = init.loadNamespaces;

        return async function (locale: Locale, namespaces: Namespace[]) {
          const value = await loaderFn(
            locale,
            Array.isArray(namespaces) ? namespaces : [namespaces], // Allow to pass a single namespace
          );

          if (!O.isStrict(value)) {
            return {};
          }

          return value;
        };
      }

      // If the user provides a function that only supports loading a single namespace at once, use it.
      // To make the switch transparent, we wrap it in a function that loads all namespaces at once by using `Promise.all`.
      if (init.loadNamespace) {
        const loaderFn = init.loadNamespace;

        return async function (locale: Locale, namespaces: Namespace[]) {
          if (S.is(namespaces)) namespaces = [namespaces] as any; // Allow to pass a single namespace

          if (namespaces.length === 1) {
            const ns = namespaces[0]!;
            const value = await loaderFn(locale, ns);

            if (O.isStrict(value)) {
              return {
                [ns]: value,
              };
            }

            return {};
          }

          const translations = {} as GenericNamespacedTranslations;

          await Promise.all(
            namespaces.map(async (ns) => {
              const value = await loaderFn(locale, ns);

              if (O.isStrict(value)) {
                translations[ns] = value;
              }
            }),
          );

          return translations;
        };
      }

      // Only throw if ever executed.
      return () => {
        throw new Error(
          "Translations: To allow for lazy loading translations, either `loadNamespaces` or `loadNamespace` must be set at initialization.",
        );
      };
    })(),
  };

  return options;
}

function localeDefinition(
  init: LocaleDefinitionInit | Locale,
  locales: Locale[] | false,
): LocaleDefinition {
  if (S.is(init)) {
    const locale = S.toLowerCase(init);

    return {
      locale: locale,
      name: locale,
      fallback: locales && locales.filter((l) => l !== locale),
    };
  }

  if (!init.locale) {
    throw new Error(`Translations: A locale definition must include a locale.`);
  }

  return {
    locale: init.locale,
    name: init.name ?? init.locale,
    fallback: (() => {
      if (Array.isArray(init.fallback)) {
        return init.fallback
          .map(S.toLowerCase)
          .filter((l) => l !== init.locale);
      }

      if (init.fallback === undefined || init.fallback === true) {
        return locales && locales.filter((l) => l !== init.locale);
      }

      if (S.is(init.fallback)) {
        if (init.fallback === init.locale) {
          console.warn(
            `Translations: A locale cannot fallback to itself: "${init.locale}".`,
          );

          return false;
        }

        return [init.fallback];
      }

      return false;
    })(),
  };
}
