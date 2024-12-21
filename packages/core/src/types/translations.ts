import type { TranslationsSchema } from "~/types/config";

/** A namespace is a string that identifies a group of translations. */
export type Namespace = keyof TranslationsSchema;

/** A value that can be used as a translation. */
export type Translation = string | ((args: any) => string);

export type {
  GenericNamespacedTranslations,
  NamespacedTranslations,
  NestedTranslationsRecord,
  PartialNamespacedTranslations,
  PartialTranslationsStore,
  TranslationsForNamespace,
  TranslationsStore,
} from "~/utils/translations";
