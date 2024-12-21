import { O } from "@auaust/primitive-kit";

/**
 * Lowercase all keys in an object in place. Goes recursively up to `depth` levels (1 by default).
 * Original object is mutated.
 * Original keys that weren't lowercased are deleted after the lowercased version is set.
 */
export function lowerCasedKeys<T extends Record<string, unknown>>(
  obj: T,
  depth: number = 1,
): T {
  for (const rawKey of O.keys(obj)) {
    const key = (rawKey as string).toLowerCase();

    if (key !== rawKey) {
      // @ts-expect-error
      obj[key] = obj[rawKey];
      delete obj[rawKey];
    }

    // If the depth's greater than 1 and the value is an object, recurse
    if (depth > 1 && O.isStrict(obj[key])) {
      lowerCasedKeys(obj[key], depth - 1);
    }
  }

  return obj;
}
