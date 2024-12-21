import { O, S } from "@auaust/primitive-kit";
import type { Locale } from "~/types/config";
import type { Namespace } from "~/types/translations";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

export function getNamespacesLoader(
  init: TranslationsInit,
): TranslationsOptions["loadNamespaces"] {
  // If the user provides a function that supports loading multiple namespaces at once, use it.
  // We only ensure the return value is always an object.
  if (init.loadNamespaces) {
    const loaderFn = init.loadNamespaces;

    return async function (locale: Locale, namespaces: Namespace[]) {
      const value = await loaderFn(
        locale,
        Array.isArray(namespaces) ? namespaces : [namespaces], // Allow to pass a single namespace
      );

      if (!O.isStrict(value)) {
        return {};
      }

      return value;
    };
  }

  // If the user provides a function that only supports loading a single namespace at once, use it.
  // To make the switch transparent, we wrap it in a function that loads all namespaces at once by using `Promise.all`.
  if (init.loadNamespace) {
    const loaderFn = init.loadNamespace;

    return async function (locale: Locale, namespaces: Namespace[]) {
      if (S.is(namespaces)) namespaces = [namespaces]; // Allow to pass a single namespace

      // If only one namespace is requested, we can use the function directly.
      if (namespaces.length === 1) {
        const ns = namespaces[0]!;
        const value = await loaderFn(locale, ns);

        if (O.isStrict(value)) {
          return {
            [ns]: value,
          };
        }

        return {};
      }

      const translations = {};

      await Promise.all(
        namespaces.map(async (ns) => {
          const value = await loaderFn(locale, ns);

          if (O.isStrict(value)) {
            // @ts-expect-error
            translations[ns] = value;
          }
        }),
      );

      return translations;
    };
  }

  // Only warn at runtime, as the user might not need to load namespaces.
  return async () => {
    console.error(
      "Translations: To allow for lazy loading translations, either `loadNamespaces` or `loadNamespace` must be set at initialization.",
    );

    return {};
  };
}
