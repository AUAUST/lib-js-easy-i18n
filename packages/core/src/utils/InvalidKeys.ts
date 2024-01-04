import { O, S } from "@auaust/primitive-kit";

/**
 * Handlers for keys that are not found.
 */
const notfoundKeysHandlers = {
  rawkey: (key) => key || "",
  prettykey: (key) =>
    S.toCustomCase(key, {
      firstWordCase: "capital",
      wordCase: "lower",
      separator: " ",
    }),
  empty: () => "",
  undefined: () => undefined,
} as const satisfies Record<string, (key?: string) => string | undefined>;

type InvalidKeysTypes = keyof typeof notfoundKeysHandlers;

const notFoundKeysOptions = O.keys(notfoundKeysHandlers);
type NotFoundKeysOptions = keyof typeof notfoundKeysHandlers;

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

export {
  notfoundKeysHandlers,
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
