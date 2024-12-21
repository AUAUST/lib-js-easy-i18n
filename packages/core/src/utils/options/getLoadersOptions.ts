import { F } from "@auaust/primitive-kit";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/**
 * Returns the current locale and a array of locale definitions.
 */
export function getLoadersOptions(
  init: TranslationsInit,
): Pick<TranslationsOptions, "loadNamespace" | "loadNamespaces"> {
  const { loadNamespace, loadNamespaces } = init ?? {};

  return {
    loadNamespace: F.is(loadNamespace) ? loadNamespace : undefined,
    loadNamespaces: F.is(loadNamespaces) ? loadNamespaces : undefined,
  };
}
