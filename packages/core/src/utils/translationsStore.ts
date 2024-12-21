import { lowerCasedKeys } from "~/utils/lowerCasedKeys";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

export function getTranslationsStore(
  init: TranslationsInit,
): TranslationsOptions["translations"] {
  if (!init.translations) return {};

  return lowerCasedKeys(init.translations, 2); // depth 2 to convert both locale and namespace keys
}
