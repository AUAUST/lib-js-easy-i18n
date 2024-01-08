import { Translations } from "~/Translations.js";
import type { Namespace } from "~/types/translations.js";
import type { TranslationsInit } from "~/utils/translations_init.js";
import type {
  TFunction,
  TFunctionReturnType,
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
} from "~/utils/t.js";
import type {
  AllowedLocales,
  DefaultLocale,
  KeysSeparator,
  Locale,
  NamespaceSeparator,
  TranslationsSchema,
} from "~/types/config.js";

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
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
};
