import { S } from "@auaust/primitive-kit";
import {
  notFoundKeysOptions,
  tooDeepKeysOptions,
  tooShallowKeysOptions,
} from "~/utils/invalidKeys";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/**
 * Returns the current locale and a array of locale definitions.
 */
export function getInvalidKeysOptions(
  init: TranslationsInit,
): Pick<
  TranslationsOptions,
  "notFoundKeys" | "tooDeepKeys" | "tooShallowKeys"
> {
  const invalidKeysInit = init.invalidKeys;

  const notFoundKeysInit = S.toLowerCase(invalidKeysInit?.notFound!);
  const notFoundKeys = notFoundKeysOptions.includes(notFoundKeysInit)
    ? notFoundKeysInit
    : "prettykey";

  const tooDeepKeysInit = S.toLowerCase(invalidKeysInit?.tooDeep!);
  const tooDeepKeys = tooDeepKeysOptions.includes(tooDeepKeysInit)
    ? tooDeepKeysInit
    : "lastvalue";

  const tooShallowKeysInit = S.toLowerCase(invalidKeysInit?.tooShallow!);
  const tooShallowKeys = tooShallowKeysOptions.includes(tooShallowKeysInit)
    ? tooShallowKeysInit
    : "notfound";

  return {
    notFoundKeys,
    tooDeepKeys,
    tooShallowKeys,
  };
}
