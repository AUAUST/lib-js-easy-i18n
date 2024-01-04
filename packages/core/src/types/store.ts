import { Join, Split, DeepEndValues } from "~/types/utils";
import type {
  Translations,
  KeysSeparator,
  NamespaceSeparator,
  WellKnownNamespaces,
  UsesGenericTypes,
  DefaultNamespace,
  UsesExtendedTranslations,
} from "./config";
import type {
  NestedTranslationsRecord,
  Namespace,
  Translation,
} from "./translations";

/** A union of all the possible keys that can be passed to `t`. */
export type NamespacedKeys = UsesGenericTypes<
  string,
  {
    [N in Namespace]: N extends WellKnownNamespaces
      ? KeysForNamespace<N, true>
      : `${N}${NamespaceSeparator}${string}`;
  }
>[Namespace];

/** A union of all the keys for the passed namespace. */
export type KeysForNamespace<
  N extends Namespace,
  IncludeNamespaces extends boolean = false
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
    ? ParseTranslations<Translations[N], N>
    : NestedTranslationsDefinition<Translations[N], N, []>;
};

/** A type that can either be a final translation or a nested object of translations. */
type TranslationOrNested = Translation | NestedTranslationsRecord;

/** Tries to find the passed key in the store and returns its definition. */
export type LookupKey<
  N extends string,
  K extends string
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
 */
export type PickProperty<
  N extends WellKnownNamespaces,
  P extends keyof GenericFinalTranslationDefinition
> = GetProperty<TheStore[N], P>;

/** Helper to get property P from either a final translation or a nested structure */
type GetProperty<
  Node,
  P extends keyof GenericFinalTranslationDefinition
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
  Store extends StoreDefinition | NestedStoreDefinitions
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
  Path extends string[] = []
> = T extends Translation
  ? FinalTranslationDefinition<T, N, Path>
  : T extends NestedTranslationsRecord
  ? NestedTranslationsDefinition<T, N, Path>
  : never;

export type TranslationDefinition =
  | GenericFinalTranslationDefinition
  | UnknownTranslationDefinition
  | GenericNestedTranslationsDefinition;

/** Describes a translation. */
type FinalTranslationDefinition<
  T extends Translation,
  N extends Namespace,
  Path extends string[]
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
};

/** Describes a nested object of translations. */
type NestedTranslationsDefinition<
  R extends NestedTranslationsRecord,
  N extends Namespace,
  Path extends string[]
> = {
  isFinal: false;
  children: {
    [K in keyof R & string]: ParseTranslations<R[K], N, [...Path, K]>;
  };
};

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

/**
 * The following are used to generate the flattened union of all the translation definitions.
 */

export type AllDefinitions = {
  [N in WellKnownNamespaces]: FlattenDefinitions<TheStore[N]>;
}[WellKnownNamespaces];

type FlattenDefinitions<T> = T extends {
  isFinal: false;
  children: infer Children;
}
  ? FlattenDefinitions<Children[keyof Children]>
  : T;

/** Picks the translation definitions where the `raw` property is a function. */
export type FunctionTranslationDefinitions = Extract<
  AllDefinitions,
  { raw: (...args: any) => any }
>;
/** The keys that lead to a function definition. */
export type FunctionTranslationKeys =
  | FunctionTranslationDefinitions["namespacedKey"]
  | Extract<
      FunctionTranslationDefinitions,
      {
        namespace: DefaultNamespace;
      }
    >["key"];

/** Map of namespace-free keys and their corresponding namespace. Only for function translations. */
export type FunctionTranslationKeysWithNamespace = {
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
export type StringTranslationKeys =
  | StringTranslationDefinitions["namespacedKey"]
  | Extract<
      StringTranslationDefinitions,
      {
        namespace: DefaultNamespace;
      }
    >["key"];

/** Map of namespace-free keys and their corresponding namespace. Only for string translations. */
export type StringTranslationKeysWithNamespace = {
  [K in StringTranslationDefinitions["key"]]: Extract<
    StringTranslationDefinitions,
    { key: K }
  >["namespace"];
};
