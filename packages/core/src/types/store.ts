import type {
  DefaultNamespace,
  KeysSeparator,
  NamespaceSeparator,
  TranslationsSchema,
  UsesExtendedTranslations,
  UsesGenericTypes,
  WellKnownNamespaces,
} from "~/types/config.ts";
import type {
  Namespace,
  NestedTranslationsRecord,
  Translation,
} from "~/types/translations.ts";
import { DeepEndValues, Join, Split } from "~/types/utils.ts";

/** A union of all the possible keys that can be passed to `t`. */
export type NamespacedKeys = UsesGenericTypes<
  string, // string if generic types are enabled
  string extends WellKnownNamespaces // No well-known namespaces means we allow any string
    ? string
    : {
        [N in Namespace]: string extends N // If there's no explicit namespace, we should allow any string.
          ? string
          : N extends WellKnownNamespaces
            ? KeysForNamespace<N, true>
            : `${N}${NamespaceSeparator}${string}`;
      }[Namespace]
>;

/** A union of all the keys for the passed namespace. */
export type KeysForNamespace<
  N extends Namespace,
  IncludeNamespaces extends boolean = false,
> = UsesGenericTypes<
  string,
  N extends WellKnownNamespaces
    ? IncludeNamespaces extends true
      ? DeepEndValues<PickProperty<N, "namespacedKey">, string>
      : DeepEndValues<PickProperty<N, "key">, string>
    : IncludeNamespaces extends true
      ? `${N}${NamespaceSeparator}${string}`
      : string
>;

/** A union of all the keys for the default namespace. */
export type KeysForDefaultNamespace<IncludeNamespaces extends boolean = false> =
  KeysForNamespace<DefaultNamespace, IncludeNamespaces>;

/**
 * An object of parsed translations.
 * It is used internally by the type system to know all the existing translations.
 * It's used for:
 * - creating the union of allowed keys
 * - determining if a key passed to `t` is valid and final
 *
 * @example ```ts
 * // Its structure is as follows:
 *
 * type TheStore = {
 *   // Namespaces also have a `isFinal` property, but it's always `false`.
 *   namespace: {
 *     isFinal: false,
 *     children: {
 *       keyPart1: {
 *         isFinal: false,
 *         children: {
 *           keyPart2: {
 *             isFinal: false,
 *             children: {
 *               keyPart3: {
 *                 isFinal: true,
 *                 raw: Translation,
 *                 final: FinalizeTranslation<Translation>,
 *                 generic: GenericifyTranslation<Translation>,
 *                 namespace: N,
 *                 path: ["keyPart1", "keyPart2", "keyPart3"],
 *                 key: "keyPart1.keyPart2.keyPart3", // Separated by `KeysSeparator`
 *                 namespacedKey: "namespace:keyPart1.keyPart2.keyPart3", // Separated by `NamespaceSeparator`
 *               }
 *             }
 *           },
 *          keyPart4: {
 *            isFinal: true,
 *            raw: Translation,
 *            final: FinalizeTranslation<Translation>,
 *            // ...
 *          }
 *         }
 *       }
 *     }
 *   }
 * }
 *
 * ```
 */
type TheStore = {
  [N in Namespace]: N extends WellKnownNamespaces
    ? ParseTranslations<TranslationsSchema[N], N>
    : NestedTranslationsDefinition<TranslationsSchema[N], N, []>;
};

/** A type that can either be a final translation or a nested object of translations. */
type TranslationOrNested = Translation | NestedTranslationsRecord;

/** Tries to find the passed key in the store and returns its definition. */
export type LookupKey<
  N extends string,
  K extends string,
> = N extends WellKnownNamespaces
  ? TheStore[N] extends {
      isFinal: true;
    }
    ? never
    : TheStore[N]["isFinal"] extends false
      ? DeepGetStore<Split<K, KeysSeparator>, TheStore[N]>
      : never
  : // If the namespace is not well-known, it means it's not typed. We return `isFinal: null` to indicate that.
    UnknownTranslationDefinition;

/**
 * Will traverse the store and return an object of the final translations's selected property.
 * For exemple, called with `PickProperty<"namespace", "namespacedKey">` it would return an object of structure similar to:
 * ```ts
 * {
 *   keyPart1: {
 *     keyPart2: "namespace:keyPart1.keyPart2",
 *     keyPart3: "namespace:keyPart1.keyPart3"
 *   },
 *  keyPart4: "namespace:keyPart4"
 * }
 * ```
 *
 * If there is no well-known namespace, it'll return unknown.
 */
export type PickProperty<
  N extends WellKnownNamespaces,
  P extends keyof GenericFinalTranslationDefinition,
> = N extends keyof TheStore ? GetProperty<TheStore[N], P> : unknown;

/** Helper to get property P from either a final translation or a nested structure */
type GetProperty<
  Node,
  P extends keyof GenericFinalTranslationDefinition,
> = Node extends GenericFinalTranslationDefinition
  ? Node[P] // Extract property from final translation node
  : Node extends { children: Record<string, any> }
    ? { [Key in keyof Node["children"]]: GetProperty<Node["children"][Key], P> }
    : never;

interface StoreDefinition {
  isFinal: true;
}

interface NestedStoreDefinitions {
  isFinal: false;
  children: {
    [key: string]: StoreDefinition | NestedStoreDefinitions;
  };
}

/**
 * Deeply accesses the store to get the definition of the passed key.
 * It handles the intermediary accesses to `children` and looks for `isFinal`.
 */
type DeepGetStore<
  Path extends unknown[],
  Store extends StoreDefinition | NestedStoreDefinitions,
> = Path extends []
  ? Store
  : Store extends { isFinal: false }
    ? Path extends [infer Head, ...infer Rest]
      ? Head extends keyof Store["children"]
        ? DeepGetStore<Rest, Store["children"][Head]>
        : never
      : never
    : never;

/**
 * Parses a "step" while traversing the store.
 * It might either return a final translation definition or recursively call itself on all entries of a nested object.
 */
type ParseTranslations<
  T extends TranslationOrNested,
  N extends Namespace,
  Path extends string[] = [],
> = T extends Translation
  ? FinalTranslationDefinition<T, N, Path>
  : T extends NestedTranslationsRecord
    ? NestedTranslationsDefinition<T, N, Path>
    : never;

export type TranslationDefinition =
  | GenericFinalTranslationDefinition
  | GenericNestedTranslationsDefinition
  | UnknownTranslationDefinition;

/** Describes a translation. */
type FinalTranslationDefinition<
  T extends Translation,
  N extends Namespace,
  Path extends string[],
> = {
  isFinal: true;

  raw: T;
  final: ExtractTranslation<T>;
  generic: GenericifyTranslation<T>;

  namespace: N;
  path: Path;
  key: Join<Path, KeysSeparator>;
  namespacedKey: `${N}${NamespaceSeparator}${Join<Path, KeysSeparator>}`;
};

export type GenericFinalTranslationDefinition = {
  isFinal: true;

  raw: Translation;
  final: ExtractTranslation<Translation>;
  generic: GenericifyTranslation<Translation>;

  namespace: Namespace;
  path: string[];
  key: string;
  namespacedKey: string;
};

type UnknownTranslationDefinition = {
  isFinal: null;

  raw: Translation;
  final: string;
  generic: Translation;

  namespace: string;
  path: string[];
  key: string;
  namespacedKey: `${string}${NamespaceSeparator}${string}`;
};

/** Describes a nested object of translations. */
type NestedTranslationsDefinition<
  R extends TranslationOrNested,
  N extends Namespace,
  Path extends string[],
> = R extends NestedTranslationsRecord
  ? {
      isFinal: false;
      children: {
        [K in keyof R & string]: ParseTranslations<R[K], N, [...Path, K]>;
      };
    }
  : never;

type GenericNestedTranslationsDefinition = {
  isFinal: false;
  children: {
    [K in string]: TranslationDefinition;
  };
};

/**
 * It'll ensure the passed translation is valid and "genericify" it.
 * - if a translation is a string literal (thanks to `as const`), it'll be converted to `string`.
 * - if a translation is a function, it'll be converted to `((args: Parameters<typeof fn>[0]) => string) | string`.
 * - if a translation is a number, it'll be converted to `string`.
 */
type GenericifyTranslation<T> = T extends (...args: any) => any
  ? ((args: Parameters<T>[0]) => string) | string
  : T extends string | number
    ? string
    : never;

/**
 * It'll ensure the passed translation is valid and extract its final type.
 * - if a translation is a string, it'll return is as is (possibly as a string literal).
 * - if a translation is a function, it'll be converted to its return type.
 * - if a translation is a number, it'll be converted to `string`.
 */
type ExtractTranslation<T> = T extends (...args: any) => infer R
  ? R extends string | number
    ? `${R}`
    : never
  : T extends string | number
    ? `${T}`
    : never;

/** Used to generate the flattened union of all the translation definitions. */
export type AllDefinitions = string extends keyof TheStore // if the generic string type matches keyof TheStore, it means there is no known namespace, thus no definition either
  ? UnknownTranslationDefinition
  : {
      [N in WellKnownNamespaces]: FlattenDefinitions<TheStore[N]>;
    }[WellKnownNamespaces];

type FlattenDefinitions<T> = T extends {
  isFinal: false;
  children: infer Children;
}
  ? string extends keyof Children // if there's no literal key, it means we're likely facing a generic NestedTranslationsRecord, which is recursive
    ? UnknownTranslationDefinition // in which case we return an unknown definition, as we don't know any explicit one
    : FlattenDefinitions<Children[keyof Children]>
  : T;

/** Picks the translation definitions where the `raw` property is a function. */
export type FunctionTranslationDefinitions = Extract<
  AllDefinitions,
  { raw: (...args: any) => any }
>;
/** The keys that lead to a function definition. */
export type FunctionTranslationKeys = UsesExtendedTranslations<
  | FunctionTranslationDefinitions["namespacedKey"]
  | Extract<
      FunctionTranslationDefinitions,
      {
        namespace: DefaultNamespace;
      }
    >["key"],
  string
>;

/** Map of namespace-free keys and their corresponding namespace. Only for function translations. */
export type FunctionTranslationKeysToNamespaceMap = {
  [K in FunctionTranslationDefinitions["key"]]: Extract<
    FunctionTranslationDefinitions,
    { key: K }
  >["namespace"];
};

/** Picks the translation definitions where the `raw` property is a string. */
export type StringTranslationDefinitions = Extract<
  AllDefinitions,
  { raw: string }
>;

/** The keys that lead to a string definition. */
export type StringTranslationKeys = UsesExtendedTranslations<
  | StringTranslationDefinitions["namespacedKey"]
  | Extract<
      StringTranslationDefinitions,
      {
        namespace: DefaultNamespace;
      }
    >["key"],
  string
>;

/** Map of namespace-free keys and their corresponding namespace. Only for string translations. */
export type StringTranslationKeysToNamespaceMap = {
  [K in StringTranslationDefinitions["key"]]: Extract<
    StringTranslationDefinitions,
    { key: K }
  >["namespace"];
};
