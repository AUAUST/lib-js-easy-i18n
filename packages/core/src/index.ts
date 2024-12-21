import { Translations } from "~/Translations.js";
import type {
  AllowedLocales,
  DefaultLocale,
  KeysSeparator,
  Locale,
  NamespaceSeparator,
  RegisteredTranslations,
  TranslationsConfig,
  TranslationsSchema,
} from "~/types/config.js";
import type {
  Namespace,
  NestedTranslationsRecord,
  Translation,
} from "~/types/translations.js";
import type {
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
  TFunction,
  TFunctionReturnType,
} from "~/utils/t.js";
import type { TranslationsInit } from "~/utils/translationsInit.js";

/**
 * Note we don't want to export the raw `t` function here since it must be initialized with a `Translations` instance to work.
 * It would be error-prone and confusing for the users. This also means there's no way to create a `t` function by other means than using `Translations`.
 * Can come back to this later if there's a need for it.
 */

export { Translations };
export type {
  AllowedLocales,
  DefaultLocale,
  KeysSeparator,
  Locale,
  LooselyTypedTFunction,
  Namespace,
  NamespaceSeparator,
  NestedTranslationsRecord,
  RegisteredTranslations,
  StrictlyTypedTFunction,
  TFunction,
  TFunctionReturnType,
  Translation,
  TranslationsConfig,
  TranslationsInit,
  TranslationsSchema,
};
