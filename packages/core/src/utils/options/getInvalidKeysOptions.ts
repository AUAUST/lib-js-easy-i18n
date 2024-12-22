import { O, S } from "@auaust/primitive-kit";
import { Translations } from "~/classes/Translations";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/** Handlers for keys that are not found. */
const notFoundKeysHandlers = {
  rawkey: (key) => S(key), // S will convert undefined to empty string
  prettykey: (key, translations) => {
    if (!key) return "";

    const { namespaceSeparator, keysSeparator } = translations.options;

    key = S.afterFirst(key, namespaceSeparator);
    key = S.beforeLast(key, keysSeparator) || key;

    return S.toCustomCase(key, {
      firstWordCase: "capital",
      wordCase: "lower",
      separator: " ",
    });
  },
  empty: () => "",
  undefined: () => undefined,
} as const satisfies Record<
  string,
  (key: string | undefined, translations: Translations) => string | undefined
>;

type InvalidKeysTypes = keyof typeof notFoundKeysHandlers;

const notFoundKeysOptions = O.keys(notFoundKeysHandlers);
type NotFoundKeysOptions = keyof typeof notFoundKeysHandlers;

/**
 * Allowed values for `tooDeepKeys`.
 * Happens for example when trying to access `a.b.c` when `a.b` is already a string.
 */
const tooDeepKeysOptions = ["notfound", "lastvalue"] as const;
type TooDeepKeysOptions = (typeof tooDeepKeysOptions)[number];

/**
 * Returns the current locale and a array of locale definitions.
 */
export function getInvalidKeysOptions(
  init: TranslationsInit,
): Pick<TranslationsOptions, "notFoundKeys" | "tooDeepKeys"> {
  const invalidKeysInit = init.invalidKeys;

  const notFoundKeysInit = S.toLowerCase(invalidKeysInit?.notFound!);
  const notFoundKeys = notFoundKeysOptions.includes(notFoundKeysInit)
    ? notFoundKeysInit
    : "prettykey";

  const tooDeepKeysInit = S.toLowerCase(invalidKeysInit?.tooDeep!);
  const tooDeepKeys = tooDeepKeysOptions.includes(tooDeepKeysInit)
    ? tooDeepKeysInit
    : "lastvalue";

  return {
    notFoundKeys,
    tooDeepKeys,
  };
}
export { notFoundKeysHandlers, notFoundKeysOptions, tooDeepKeysOptions };

export type { InvalidKeysTypes, NotFoundKeysOptions, TooDeepKeysOptions };
