import { Translations } from "~/Translations";
import type { Namespace } from "~/types/translations";
import type { TranslationsInit } from "~/utils/translations_init";
import type { TFunction, TFunctionReturnType } from "~/utils/t";
import type {
  AllowedLocales,
  DefaultLocale,
  KeysSeparator,
  Locale,
  NamespaceSeparator,
  TranslationsSchema,
} from "~/types/config";

/**
 * Note we don't want to export the raw `t` function here since it must be initialized with a `Translations` instance to work.
 * It would be confusing and error-prone.
 */

export { Translations };
export type {
  Locale,
  AllowedLocales,
  DefaultLocale,
  Namespace,
  TranslationsInit,
  TranslationsSchema,
  KeysSeparator,
  NamespaceSeparator,
  TFunction,
  TFunctionReturnType,
};
