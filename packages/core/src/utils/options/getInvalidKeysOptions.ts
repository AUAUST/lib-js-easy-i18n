import { O, S } from "@auaust/primitive-kit";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/** Handlers for keys that are not found. */
const notFoundKeysHandlers = {
  rawkey: (key) => S(key), // S will convert undefined to empty string
  prettykey: (key) =>
    S.toCustomCase(key, {
      firstWordCase: "capital",
      wordCase: "lower",
      separator: " ",
    }),
  empty: () => "",
  undefined: () => undefined,
} as const satisfies Record<string, (key?: string) => string | undefined>;

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
 * Allowed values for `tooShallowKeys`.
 * Happens for example when trying to access `a.b` when it's an object where `a.b.c` would be the translation.
 */
const tooShallowKeysOptions = ["notfound", "object"] as const;
type TooShallowKeysOptions = (typeof tooShallowKeysOptions)[number];

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
export {
  notFoundKeysHandlers,
  notFoundKeysOptions,
  tooDeepKeysOptions,
  tooShallowKeysOptions,
};

export type {
  InvalidKeysTypes,
  NotFoundKeysOptions,
  TooDeepKeysOptions,
  TooShallowKeysOptions,
};
