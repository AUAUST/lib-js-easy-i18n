import type { Locale, TranslationsSchema } from "~/types/config";
import type { Namespace, Translation } from "~/types/translations";
import type { NestedRecord } from "~/types/utils";
import { lowerCasedKeys } from "~/utils/lowerCasedKeys";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/** A generic translation object. It is unaware of the user-provided namespaces. */
export type NestedTranslationsRecord = NestedRecord<string, Translation>;

/** An object with all namespaces and their translations. */
export type NamespacedTranslations = {
  [N in Namespace]: TranslationsForNamespace<N>;
};

/** A translation object for a specific namespace. */
export type TranslationsForNamespace<N extends keyof TranslationsSchema> =
  TranslationsSchema[N];

/** A partial object of namespaces and their translations. */
export type PartialNamespacedTranslations = Partial<NamespacedTranslations>;

/** A generic object of namespaces and their translations. */
export type GenericNamespacedTranslations = Record<
  string,
  NestedTranslationsRecord | undefined
>;

/** The global translation object. It's a record of locales to their namespaced translations. */
export type TranslationsStore = Record<Locale, Map<string, Translation>>;

/** A partial global translation object. */
export type PartialTranslationsStore = Partial<
  Record<Locale, PartialNamespacedTranslations>
>;

export function getTranslationsStore(
  init: TranslationsInit,
): TranslationsOptions["translations"] {
  if (!init.translations) return {};

  return lowerCasedKeys(init.translations, 2); // depth 2 to convert both locale and namespace keys
}
