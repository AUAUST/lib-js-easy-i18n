import { Translations } from "~/Translations.js";
import type { Namespace, Translation } from "~/types/translations.js";
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
  RegisteredTranslations,
  TranslationsConfig,
} from "~/types/config.js";

/**
 * Note we don't want to export the raw `t` function here since it must be initialized with a `Translations` instance to work.
 * It would be error-prone and confusing for the users. This also means there's no way to create a `t` function by other means than using `Translations`.
 * Can come back to this later if there's a need for it.
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
  Translation,
  RegisteredTranslations,
  TranslationsConfig,
};
