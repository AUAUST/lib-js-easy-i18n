import { O, S } from "@auaust/primitive-kit";
import type {
  NamespaceSeparator,
  NotFoundKeysReturnType,
  TooDeepKeysReturnType,
  TooShallowKeysReturnType,
  UnknownNamespaces,
  UsesExtendedTranslations,
  UsesGenericTypes,
} from "~/types/config.js";
import type {
  FunctionTranslationKeys,
  FunctionTranslationKeysToNamespaceMap,
  GenericFinalTranslationDefinition,
  LookupKey,
  StringTranslationKeys,
  StringTranslationKeysToNamespaceMap,
  TranslationDefinition,
} from "~/types/store.js";
import type {
  GenericNamespacedTranslations,
  Namespace,
  NestedTranslationsRecord,
  Translation,
} from "~/types/translations.js";
import type { TranslationsOptions } from "~/utils/translations_init.js";

import { notFoundKeysHandlers } from "~/utils/invalid_keys.js";

// T-FUNCTION RETURN TYPE

/** Based on the configuration, the `t` function might return a variety of types. */
export type TFunctionReturnType =
  | string
  | NotFoundKeysReturnType
  | TooDeepKeysReturnType
  | TooShallowKeysReturnType;

type TFunction = UsesGenericTypes<
  // Use loose types for `t` if the config says so
  LooselyTypedTFunction,
  UsesExtendedTranslations<
    // Also loosely type `t` if there's no type extension on which to base strict types
    StrictlyTypedTFunction,
    LooselyTypedTFunction
  >
>;

interface LooselyTypedTFunction {
  (): TooShallowKeysReturnType; // Based on the config, might either return an empty string or the whole translations object for the locale.
  (key: string): TFunctionReturnType;
  (key: string, options: { ns?: string; arg?: any }): TFunctionReturnType;
}

interface StrictlyTypedTFunction {
  // No key provided
  (): TooShallowKeysReturnType;

  // Namespaced key provided
  <K extends StringTranslationKeys>(
    key: K,
    options?: { ns?: undefined },
  ): ReturnTypeFromKey<K>;

  // Key provided; namespace in options
  // The implementation of this overload makes it possible to pass any key, then get hinted the namespace(s) that include it.
  <K extends keyof StringTranslationKeysToNamespaceMap>(
    key: K,
    options: {
      ns: StringTranslationKeysToNamespaceMap[K];
    },
  ): ReturnTypeFromKey<K, StringTranslationKeysToNamespaceMap[K]>;

  // Keys that lead to function translations; namespace in key
  <K extends FunctionTranslationKeys>(
    key: K,
    options: {
      ns?: undefined;
      arg: ArgFromKey<K>;
    },
  ): ReturnTypeFromKey<K>;

  // Keys that lead to function translations; namespace in options
  // The implementation of this overload makes it possible to pass any key, then get hinted the namespace(s) that include it.
  <K extends keyof FunctionTranslationKeysToNamespaceMap>(
    key: K,
    options: {
      ns: FunctionTranslationKeysToNamespaceMap[K];
      arg?: ArgFromKey<K, FunctionTranslationKeysToNamespaceMap[K]>;
    },
  ): ReturnTypeFromKey<K, FunctionTranslationKeysToNamespaceMap[K]>;

  // Namespaces that have no strong types, which means we allow any `${namespace}:${string}` format.
  // Since we can't know the type of the key, we can't know whether it's a function or a string.
  // This means the `arg` option is always available as an optional unknown.
  (
    key: `${UnknownNamespaces}${NamespaceSeparator}${string}`,
    options?: { arg?: any },
  ): TFunctionReturnType;
  (
    key: string,
    option: { ns: UnknownNamespaces; arg?: any },
  ): TFunctionReturnType;

  // Edge case: key is an empty string
  // It will match the actual implementation as the key is checked for falsiness,
  // but it's mainly useful to hint the available namespaces.
  // This way the user can start typing`t("", { ns: })`, get hinted the namespaces, then select one and get back to filling the key.
  // Without this overload, a user writing the options first wouldn't get any hint on the namespaces.
  (
    key: "" | undefined,
    options: { ns: Namespace; arg?: any },
  ): TooShallowKeysReturnType;
}

/** Extracts the first argument's type for a function translation. */
type ArgFromKey<
  K extends string,
  N extends Namespace | undefined = undefined,
> = DefinitionFromKey<K, N> extends infer D
  ? D extends GenericFinalTranslationDefinition
    ? D["raw"] extends (...args: any) => any
      ? Parameters<D["raw"]>[0]
      : unknown
    : unknown
  : unknown;

/** Returns a definition type from a key and namespace. */
type DefinitionFromKey<
  K extends string,
  N extends Namespace | undefined = undefined,
> = K extends `${infer N}${NamespaceSeparator}${infer K}`
  ? K extends ""
    ? undefined
    : LookupKey<N, K>
  : N extends Namespace
    ? LookupKey<N, K>
    : undefined;

type ReturnTypeFromKey<
  K extends string,
  N extends Namespace | undefined = undefined,
> = DefinitionFromKey<K, N> extends infer D
  ? D extends TranslationDefinition
    ? HandleKeyDefinition<D>
    : NotFoundKeysReturnType
  : never;

type HandleKeyDefinition<D extends TranslationDefinition> = D extends {
  isFinal: true;
}
  ? D["final"]
  : D extends { isFinal: null }
    ? NotFoundKeysReturnType
    : TooShallowKeysReturnType;

/** A subset of the `TranslationsOptions` that only contains the parts that are used by the `t` function. */
type TFunctionConfig = Pick<
  TranslationsOptions,
  | "locale"
  | "locales"
  | "translations"
  | "defaultNamespace"
  | "notFoundKeys"
  | "tooDeepKeys"
  | "tooShallowKeys"
  | "namespaceSeparator"
  | "keysSeparator"
>;

/**
 * The `t` function is used to translate a key into a string.
 * The key is a string that is composed of the namespace and the key.
 * If no namespace is provided, the default namespace is used.
 * It's possible to provide a namespace by passing the `ns` option.
 *
 * With TypeScript, it's not possible to pass the namespace both as a key and as an option.
 * At runtime, the namespace in the key would override the namespace in the options.
 */
// Internal usage note: The `t` function is a generic function that's aimed to be setup with `bind`.
// That is because the translations and config options are looked up from the `this` variable.
// The value of `this` MUST have the structure of `TFunctionThis`.
// Switching the locale is done by re-calling `bind` with the new locale's namespaces and config.
// The reactive part must be handled by adapters;
// i.e. wrapping the `t` function in a signal and update its value on locale change to the newly `bind`ed function.
const t: TFunction = function (
  this: TFunctionConfig,
  key?: string,
  options?: {
    ns?: string;
    arg?: any;
  },
) {
  if (!key) {
    return tooShallowKey(this, this.translations?.[this.locale]!, key);
  }

  const { ns, segments, rawKey } = parseKey(this, key, options);

  // The segments might be empty if the key is something like `t("namespace:")`.
  if (!segments || !segments.length) {
    return tooShallowKey(this, this.translations?.[this.locale]?.[ns], rawKey);
  }

  const localeDefinition = this.locales[this.locale];

  if (!localeDefinition) {
    console.error(
      `Translations: Tried to access translations for a locale that is not allowed: "${this.locale}".`,
    );

    return notFoundKey(this, rawKey) as any;
  }

  let localeIndex = 0;
  let locale = this.locale;

  do {
    let translations: NestedTranslationsRecord | undefined =
      this.translations?.[locale]?.[ns];

    if (!translations) continue;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]!;
      const value: NestedTranslationsRecord | Translation | undefined =
        translations?.[segment];

      if (isTranslation(value)) {
        // If the value is a translation already but there are still segments left,
        // if means that the key is too deep.
        if (i < segments.length - 1 && this.tooDeepKeys === "notfound") {
          return notFoundKey(this, rawKey);
        }

        // Otherwise it's the last segment, so we can return the value.
        return translationValue(value, options);
      }

      // If the value isn't a translation but we're at the last segment,
      // it means that the key is too shallow OR that the value is undefined or otherwise invalid.
      if (i === segments.length - 1) {
        // If the value is an object, we can return it since `tooShallowKeys` is set to "object".
        if (this.tooShallowKeys === "object" && O.is(value)) {
          return value as any;
        }

        // If it's not an object, it's an otherwise invalid value we don't want to return.
        // We don't do anything, allowing for the next locale in the fallback chain to be used.
      }

      translations = value;

      // Otherwise it's an object, so we can continue.
    }
  } while (
    localeDefinition.fallback &&
    (locale = localeDefinition.fallback[localeIndex++]!)
  );

  return notFoundKey(this, rawKey) as any;
} satisfies TFunction;

function parseKey(
  config: Pick<
    TFunctionConfig,
    "defaultNamespace" | "namespaceSeparator" | "keysSeparator"
  >,
  key: string,
  options?: { ns?: string },
) {
  let ns: string;
  let rawKey: string | undefined = undefined;

  const nsSep = config.namespaceSeparator;

  // Extremely edgy case that must be handled;
  // receiving only the namespace separator.e.g. `t(":")`)
  if (key === nsSep) {
    return {
      ns: config.defaultNamespace,
      rawKey: "",
      segments: false as const,
    };
  }

  if ((ns = S.beforeFirst(key, nsSep))) {
    rawKey = S.afterFirst(key, nsSep);
  } else if (options?.ns) {
    ns = options.ns;
    rawKey = key;
  }

  if (!ns) {
    ns = config.defaultNamespace;
    rawKey = key;
  }

  return {
    ns: ns.toLowerCase(), // namespace
    rawKey, // key without the namespace
    segments: !!rawKey && rawKey.split(config.keysSeparator),
  };
}

function translationValue(translation: Translation, options?: { arg?: any }) {
  if (typeof translation === "function") {
    return String(translation(options?.arg ?? {}));
  }

  return String(translation);
}

function isTranslation(value: any): value is Translation {
  switch (typeof value) {
    case "string":
    case "function":
    case "number": // While not officially supported, it makes no arm to support numbers.
      return true;
    default:
      return false;
  }
}

function notFoundKey(
  config: TFunctionConfig,
  key?: string,
): TFunctionReturnType {
  return notFoundKeysHandlers[config.notFoundKeys](key)!;
}

function tooShallowKey(
  config: TFunctionConfig,
  object: GenericNamespacedTranslations | NestedTranslationsRecord | undefined,
  key: string | undefined,
): TFunctionReturnType {
  if (object && config.tooShallowKeys === "object") {
    // It's impossible to satisfy the type system here because an extension
    // of the config interface will always change the value of `TFunctionReturnType`.
    return object as any;
  }

  return notFoundKey(config, key);
}

export { t, parseKey };
export type {
  TFunction,
  // Exporting them is required for the `TFunction` type to be usable outside of this file.
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
};
