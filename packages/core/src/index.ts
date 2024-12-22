import { Translations } from "~/classes/Translations";
import type {
  AllowedLocales,
  DefaultLocale,
  KeysSeparator,
  Locale,
  NamespaceSeparator,
  RegisteredTranslations,
  TranslationsConfig,
  TranslationsSchema,
} from "~/types/config";
import type {
  LooselyTypedTFunction,
  StrictlyTypedTFunction,
  TFunctionReturnType,
  TranslateFunction,
} from "~/types/t";
import type {
  Namespace,
  NestedTranslationsRecord,
  Translation,
} from "~/types/translations";
import type { TranslationsInit } from "~/utils/options/index";

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
  /** @deprecated Use `TranslateFunction` instead. */
  TranslateFunction as TFunction,
  TFunctionReturnType,
  TranslateFunction,
  Translation,
  TranslationsConfig,
  TranslationsInit,
  TranslationsSchema,
};
