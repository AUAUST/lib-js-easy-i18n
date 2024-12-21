import { A, S } from "@auaust/primitive-kit";
import type { KeysSeparator, NamespaceSeparator } from "~/types/config";

/**
 * Returns the complete key with the namespace prepended, used to store and retrieve translations.
 * If no namespace is provided, neither in the key nor as a parameter, `null` is returned.
 */
export function getKey(
  key: string | string[],
  namespace: string | undefined,
  namespaceSeparator: NamespaceSeparator,
  keysSeparator: KeysSeparator,
): string | undefined {
  namespaceSeparator = S.lower(namespaceSeparator);
  namespace = S.lower(namespace);
  key = S.lower(
    A.is(key) ? key.filter(Boolean).join(S.lower(keysSeparator)) : key,
  ).trim();

  // The key already contains the namespace, so we return it as is.
  if (namespace && S.beforeFirst(key, namespaceSeparator) === namespace) {
    return key;
  }

  if (namespace === "") {
    return undefined;
  }

  // The key doesn't contain the namespace, so we prepend it.
  return `${namespace}${namespaceSeparator}${key}`;
}
