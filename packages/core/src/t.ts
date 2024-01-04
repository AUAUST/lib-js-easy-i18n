import { O, S } from "@auaust/primitive-kit";
import type { NamespaceSeparator, Translations } from "./types/config";
import type {
  Namespace,
  NestedTranslationsRecord,
  Translation,
} from "./types/translations";
import type {
  NotFoundKeysReturnType,
  TooDeepKeysReturnType,
  TooShallowKeysReturnType,
  UsesGenericTypes,
} from "./types/config";
import type { TranslationsOptions } from "./utils/Init";
import type {
  FunctionTranslationKeys,
  FunctionTranslationKeysWithNamespace,
  GenericFinalTranslationDefinition,
  LookupKey,
  StringTranslationKeys,
  StringTranslationKeysWithNamespace,
  TranslationDefinition,
} from "./types/store";

import { notfoundKeysHandlers } from "./utils/InvalidKeys";

// T-FUNCTION RETURN TYPE

/** Based on the configuration, the `t` function might return a variety of types. */
export type TFunctionReturnType =
  | string
  | NotFoundKeysReturnType
  | TooDeepKeysReturnType
  | TooShallowKeysReturnType;

type TFunction = UsesGenericTypes<
  LooselyTypedTFunction,
  StrictlyTypedTFunction
>;

interface LooselyTypedTFunction {
  (): TooShallowKeysReturnType; // Based on the config, might either return an empty string or the whole translations object for the locale.
  (key: string): TFunctionReturnType;
  (
    key: string,
    options: { ns?: string; arg?: Record<string, any> }
  ): TFunctionReturnType;
}

interface StrictlyTypedTFunction {
  // No key provided
  (): TooShallowKeysReturnType;

  // Namespaced key provided
  <K extends StringTranslationKeys>(
    key: K,
    options?: { ns?: undefined }
  ): ReturnTypeFromKey<K>;

  // Key provided; namespace in options
  // The implementation of this overload makes it possible to pass any key, then get hinted the namespace(s) that include it.
  <K extends keyof StringTranslationKeysWithNamespace>(
    key: K,
    options: {
      ns: StringTranslationKeysWithNamespace[K];
    }
  ): ReturnTypeFromKey<K, StringTranslationKeysWithNamespace[K]>;

  // Keys that lead to function translations; namespace in key
  <K extends FunctionTranslationKeys>(
    key: K,
    options: {
      ns?: undefined;
      arg: ArgFromKey<K>;
    }
  ): ReturnTypeFromKey<K>;

  // Keys that lead to function translations; namespace in options
  // The implementation of this overload makes it possible to pass any key, then get hinted the namespace(s) that include it.
  <K extends keyof FunctionTranslationKeysWithNamespace>(
    key: K,
    options: {
      ns: FunctionTranslationKeysWithNamespace[K];
      arg: ArgFromKey<K, FunctionTranslationKeysWithNamespace[K]>;
    }
  ): ReturnTypeFromKey<K, FunctionTranslationKeysWithNamespace[K]>;

  // Edge case: key is empty string
  // It will match the actual implementation as the key's checked for falsiness,
  // but it's before mainly useful to hint the namespaces available.
  // This way the user can start typing`t("", { ns: })`, get hinted the namespaces, then select one and get back to typing the key.
  // Without this overload, a user writing the options first wouldn't get any hint on the namespaces.
  (
    key: "" | undefined,
    options: { ns: Namespace; arg?: any }
  ): TooShallowKeysReturnType;
}

/** Extracts the first argument's type for a function translation. */
type ArgFromKey<
  K extends string,
  N extends Namespace | undefined = undefined
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
  N extends Namespace | undefined = undefined
> = K extends `${infer N}${NamespaceSeparator}${infer K}`
  ? K extends ""
    ? undefined
    : LookupKey<N, K>
  : N extends Namespace
  ? LookupKey<N, K>
  : undefined;

type ReturnTypeFromKey<
  K extends string,
  N extends Namespace | undefined = undefined
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
  | "localesDefinitions"
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
  }
) {
  if (!key) {
    return this.tooShallowKeys === "object"
      ? (this.translations as TFunctionReturnType)
      : notFoundKey(this);
  }

  const { ns, segments } = parseKey(this, key, options);

  if (!segments || !segments.length) {
    return notFoundKey(this);
  }

  const localeDefinition = this.localesDefinitions[this.locale];

  if (!localeDefinition) {
    console.error(
      `Translations: Tried to access translations for a locale that is not allowed: "${this.locale}".`
    );

    return notFoundKey(this, key) as any;
  }

  let localeIndex = 0;
  let locale = this.locale;

  do {
    let translations: NestedTranslationsRecord | undefined =
      this.translations?.[locale]?.[ns];

    if (!translations) continue;

    for (let i = 0; i < segments.length; i++) {
      if (i === segments.length - 1) {
        console.log(
          "last segment",
          segments[i],
          translations,
          translations?.[segments[i]]
        );
      }

      const segment = segments[i];
      const value = translations?.[segment];

      if (isTranslation(value)) {
        // If the value is a translation already but there are still segments left,
        // if means that the key is too deep.
        if (i < segments.length - 1 && this.tooDeepKeys === "notfound") {
          return notFoundKey(this, key);
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

      // Otherwise it's an object, so we can continue.
    }
  } while (
    localeDefinition.fallback &&
    (locale = localeDefinition.fallback[localeIndex++])
  );

  console.log(ns, segments, localeDefinition, locale);

  return notFoundKey(this, key) as any;
} satisfies TFunction;

function parseKey(
  config: TFunctionConfig,
  key: string,
  options?: { ns?: string }
) {
  let ns: string;
  let rawKey: string | undefined = undefined;

  if ((ns = S.beforeFirst(key, config.namespaceSeparator))) {
    rawKey = S.afterFirst(key, config.namespaceSeparator);
  } else if (options?.ns) {
    ns = options.ns;
    rawKey = key;
  }

  if (!ns) {
    ns = config.defaultNamespace;
    rawKey = key;
  }

  return {
    ns,
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

function notFoundKey(config: TFunctionConfig, key?: string) {
  return notfoundKeysHandlers[config.notFoundKeys](key)!;
}

export { t };
export type { TFunction };
