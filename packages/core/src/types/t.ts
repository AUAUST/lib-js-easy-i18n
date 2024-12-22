import type {
  NamespaceSeparator,
  NotFoundKeysReturnType,
  TooDeepKeysReturnType,
  UnknownNamespaces,
  UsesExtendedTranslations,
  UsesGenericTypes,
} from "~/types/config";
import type {
  FunctionTranslationKeys,
  FunctionTranslationKeysToNamespaceMap,
  GenericFinalTranslationDefinition,
  LookupKey,
  StringTranslationKeys,
  StringTranslationKeysToNamespaceMap,
  TranslationDefinition,
} from "~/types/store";
import type { Namespace } from "~/types/translations";
import type { TranslationsOptions } from "~/utils/options/index";

// T-FUNCTION RETURN TYPE

/** Based on the configuration, the `t` function might return a variety of types. */
export type TFunctionReturnType =
  | string
  | NotFoundKeysReturnType
  | TooDeepKeysReturnType;

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
  (): TFunctionReturnType; // Based on the config, might either return an empty string or the whole translations object for the locale.
  (key: string): TFunctionReturnType;
  (key: string, options: { ns?: string; arg?: any }): TFunctionReturnType;
}

interface StrictlyTypedTFunction {
  // No key provided
  (): TFunctionReturnType;

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
  ): TFunctionReturnType;
}

/** Extracts the first argument's type for a function translation. */
type ArgFromKey<K extends string, N extends Namespace | undefined = undefined> =
  DefinitionFromKey<K, N> extends infer D
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
> =
  DefinitionFromKey<K, N> extends infer D
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
    : TFunctionReturnType;

/** A subset of the `TranslationsOptions` that only contains the parts that are used by the `t` function. */
export type TFunctionConfig = Pick<
  TranslationsOptions,
  | "locale"
  | "locales"
  | "defaultNamespace"
  | "notFoundKeys"
  | "tooDeepKeys"
  | "namespaceSeparator"
  | "keysSeparator"
>;

export type {
  // Exporting them is required for the `TFunction` type to be usable outside of this file.
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
  TFunction,
};
