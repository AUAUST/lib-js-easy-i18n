import { S } from "@auaust/primitive-kit";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/**
 * Returns the current locale and a array of locale definitions.
 */
export function getSyntaxOptions(
  init: TranslationsInit,
): Pick<TranslationsOptions, "namespaceSeparator" | "keysSeparator"> {
  const syntaxInit = init.syntax;

  const namespaceSeparator = S.is(syntaxInit?.namespaceSeparator)
    ? syntaxInit.namespaceSeparator
    : ":";

  const keysSeparator = S.is(syntaxInit?.keysSeparator)
    ? syntaxInit.keysSeparator
    : ".";

  return {
    namespaceSeparator,
    keysSeparator,
  };
}
