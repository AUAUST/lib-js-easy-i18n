/**
 * This file provides user-extensible interfaces that allows to make sure the type level matches the configuration.
 */

import type { Namespace, NestedTranslationsRecord } from "~/types/translations";
import type { IsInterfaceEmpty } from "~/types/utils";
import type {
  NotFoundKeysOptions,
  TooDeepKeysOptions,
} from "~/utils/options/getInvalidKeysOptions";

/**
 * An interface you can extend with the namespaces you want to use.
 * It will be used to enforce that all locales provide the same translations, and will enable type checking for translation keys.
 * If you don't know exactly the available translations for a namespace or don't have a static way to access its type, you can set a namespace to `true` and it'll allow any translation within that namespace.
 *
 * When defining a translation object, you can use the `Translations` type to ensure the object is valid.
 * Be sure to use `satisfies Translations` instead of `as Translations` or `const translations: Translations = ...` to avoid type erasure.
 * Using `satisfies` will ensure the type is checked and you only pass valid translations.
 * If you use `as` or `: Translations`, the type will be erased and you'll get back to a generic type with only limited type checking.
 *
 * If you want extra-fancy hinting, you can use `as const satisfies Translations`. In this configuration, using the `t` function will let you know the actual translation in the editor.
 * For exemple, if you use `t("auth:login")`, you'll see `Sign in` in the editor instead of `string`.
 * This can come handy when you have a lot of translations and you want to know which one you're using, since keys are often minimalistic and don't provide much context.
 *
 * @example ```ts
 * // index.ts
 * import globalTranslations from "/locales/en/global";
 *
 * declare module "@auaust/easy-i18n" {
 *   export interface RegisteredTranslations {
 *     global: typeof globalTranslations;
 *     auth: true;
 *   }
 * }
 *
 * // /locales/en/global.ts
 * import { type Translations } from "@auaust/easy-i18n";
 *
 * export default {
 *   hello: "Hello",
 *   world: "World",
 * } as const satisfies Translations;
 * ```
 */
export interface RegisteredTranslations {}

/**
 * A configuration interface you can extend to ensure the types do match your configuration.
 * If you have issues with typings, you can set the `genericTypes` option to `true` to drastically reduce the amount of type checking.
 * It'll effectively convert most types to `string` and don't infer much.
 *
 * @example ```ts
 * declare module "@auaust/easy-i18n" {
 *   export interface TranslationsConfig {
 *     genericTypes: false; // boolean
 *
 *     defaultLocale: "en"; // string
 *     allowedLocales: ["en"] // string[]
 *
 *     defaultNamespace: "translations"; // keyof RegisteredTranslations
 *
 *     keysSeparator: "."; // string
 *     namespaceSeparator: ":"; // string
 *
 *     notFoundKeys: "prettykey" // NotFoundKeysOptions
 *     tooDeepKeys: "lastvalue" // TooDeepKeysOptions
 *   }
 * }
 * ```
 */
export interface TranslationsConfig {}

// Used to validate the config.
// Each entry is a tuple of [<type>, <default value>]
// The type ensures the user-provided value can indeed be used as a config value.
// If either unset or invalid, the default value is used.
interface TranslationsConfigDefaults {
  genericTypes: [boolean, false];

  defaultLocale: [string, string];
  allowedLocales: [string[], string[]];

  defaultNamespace: [keyof RegisteredTranslations, "translations"];

  keysSeparator: [string, "."];
  namespaceSeparator: [string, ":"];

  notFoundKeys: [NotFoundKeysOptions, "prettykey"];
  tooDeepKeys: [TooDeepKeysOptions, "lastvalue"];
}

// USER-PROVIDED TRANSLATIONS-RELATED TYPES

/**
 * A type that represents the structure of the available translations. It is as specific as the user-provided translations allow.
 * Based on the `RegisteredTranslations` interface but falls back to a generic nested object of unknown translations if no namespaces are provided.
 * Each root key is a namespace.
 */
export type TranslationsSchema = keyof RegisteredTranslations extends never
  ? // No namespaces provided, use generic translations.
    Record<string, NestedTranslationsRecord>
  : // Handle the different allowed types for a namespace.
    {
      [K in keyof RegisteredTranslations]: RegisteredTranslations[K] extends true
        ? // If the namespace is set to `true`, allow any translation.
          NestedTranslationsRecord
        : // Otherwise, validate the translations.
          RegisteredTranslations[K];
    };

type GetConfig<K extends keyof TranslationsConfigDefaults> =
  K extends keyof TranslationsConfig
    ? TranslationsConfig[K] extends TranslationsConfigDefaults[K][0]
      ? TranslationsConfig[K]
      : TranslationsConfigDefaults[K][1]
    : TranslationsConfigDefaults[K][1];

// CONDITIONAL HELPERS

/** If the user extended the `RegisteredTranslations` interface, uses the first type, otherwise uses the second. */
export type HasRegisteredTranslations<True, False> =
  IsInterfaceEmpty<RegisteredTranslations> extends true ? False : True;

/** If the user wishes to use less strict types, uses the first type, otherwise uses the second. */
export type PrefersLooserTypes<True, False> =
  GetConfig<"genericTypes"> extends true ? True : False;

// LOCALES-RELATED TYPES

/** Any locale on the instance. */
export type Locale = PrefersLooserTypes<string, AllowedLocales[number]>;

/** The default locale. */
export type DefaultLocale = PrefersLooserTypes<
  string,
  GetConfig<"defaultLocale">
>;

/** The allowed locales. */
export type AllowedLocales = PrefersLooserTypes<
  string[],
  GetConfig<"allowedLocales">
>;

// NAMESPACES-RELATED TYPES

/** The default namespace. */
export type DefaultNamespace = PrefersLooserTypes<
  string,
  GetConfig<"defaultNamespace">
>;

/** The namespaces that provide explicit types. False for namespaces that allow any translation. */
export type WellknownNamespaces = HasRegisteredTranslations<
  {
    [K in Namespace]: string extends keyof TranslationsSchema[K] ? never : K;
  }[Namespace],
  string
>;
/** The namespaces that allow any translation. They come from namespaces set to `true` in the `RegisteredTranslations` interface. */
export type UnknownNamespaces = HasRegisteredTranslations<
  {
    [K in Namespace]: string extends keyof TranslationsSchema[K] ? K : never;
  }[Namespace],
  never
>;

// SYNTAX-RELATED TYPES

/** The separator used to separate key segments. */
export type KeysSeparator = GetConfig<"keysSeparator">;

/** The separator used to separate the namespace from keys. */
export type NamespaceSeparator = GetConfig<"namespaceSeparator">;

// INVALID KEYS HANDLERS

/** The value of an invalid key when the key is not found. */
export type NotFoundKeysReturnType =
  GetConfig<"notFoundKeys"> extends "undefined" ? undefined : string; // If `notFoundKeys` is set to anything else than "undefined", it'll be a string. (maybe empty, maybe ugly, but a string)

/** The value a key that is too deep will return. */
export type TooDeepKeysReturnType =
  GetConfig<"tooDeepKeys"> extends "lastvalue"
    ? string // If `tooDeepKeys` is set to "lastvalue", it'll be a string. (maybe empty, maybe ugly, but a string)
    : NotFoundKeysReturnType;
