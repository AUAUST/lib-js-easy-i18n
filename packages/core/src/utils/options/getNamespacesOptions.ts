import { S } from "@auaust/primitive-kit";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

export function getNamespacesOptions(
  init: TranslationsInit,
): Pick<TranslationsOptions, "defaultNamespace" | "requiredNamespaces"> {
  const nsInit = init.namespaces;

  if (!nsInit) {
    return {
      defaultNamespace: "translations",
      requiredNamespaces: ["translations"],
    };
  }

  if (S.is(nsInit)) {
    const namespace = S.toLowerCase(nsInit);

    return {
      defaultNamespace: namespace,
      requiredNamespaces: [namespace],
    };
  }

  const defaultNamespace = S.toLowerCase(nsInit.default);
  const requiredNamespaces = (nsInit.required ?? [defaultNamespace]).map((ns) =>
    S.toLowerCase(ns),
  );

  if (!requiredNamespaces.includes(defaultNamespace)) {
    requiredNamespaces.unshift(defaultNamespace);
  }

  return {
    defaultNamespace,
    requiredNamespaces,
  };
}
