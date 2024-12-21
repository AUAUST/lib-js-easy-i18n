import { O } from "@auaust/primitive-kit";
import type { KeysSeparator } from "~/types/config";
import type { Namespace } from "~/types/translations";
import type { NestedTranslationsRecord, TranslationsMap } from ".";
import type { TranslationsOptions } from "../options";

/** Returns a new map to store translations. */
export function getTranslationsMap(): TranslationsMap {
  return new Map();
}

/** Registers the translations into the map. */
export function registerTranslations(
  map: TranslationsMap,
  namespace: Namespace,
  translations: NestedTranslationsRecord | undefined,
  config: TranslationsOptions,
): TranslationsMap {
  if (!translations) return map;

  const keysSeparator = config.keysSeparator,
    namespaceSeparator = config.namespaceSeparator;

  setTranslations(
    map,
    translations,
    `${namespace}${namespaceSeparator}`,
    keysSeparator,
  );

  return map;
}

function setTranslations(
  map: TranslationsMap,
  translations: NestedTranslationsRecord,
  prefix: string,
  keysSeparator: KeysSeparator,
) {
  for (const [part, value] of O.entries(translations)) {
    const key = `${prefix}${keysSeparator}${part}`;

    switch (typeof value) {
      case "string":
      case "function":
      case "number": // While not officially supported, it makes no arm to support numbers.
        // TODO: Here, pass the value through a "processor" that takes care of plugins
        map.set(key, value);
        break;
      case "object":
        setTranslations(map, value, key, keysSeparator);
        break;
    }
  }
}
