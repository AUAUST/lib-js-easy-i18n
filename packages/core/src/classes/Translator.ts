import { S } from "@auaust/primitive-kit";
import { Translations } from "~/classes/Translations";
import type { KeysSeparator, NamespaceSeparator } from "~/types/config";
import type { Namespace } from "~/types/translations";
import { notFoundKeysHandlers } from "~/utils/options/getInvalidKeysOptions";
import { getKey } from "~/utils/translations/keys";

/**
 * This class is only responsible for the translation mechanism,
 * but not for the storage or loading of translations nor configuration.
 *
 * It keeps track of its parent `Translations` instance, which is the configuration provider.
 */
export class Translator {
  constructor(private translations: Translations) {}

  public translate(
    key: string,
    options: {
      ns?: Namespace;
      namespace?: Namespace;
      namespaceSeparator?: NamespaceSeparator;
      keysSeparator?: KeysSeparator;
    },
  ) {
    return this.getTranslation(key, options);
  }

  /**
   * Returns the translation for the given key.
   * The fallback mechanism is already applied, but the translation is still unprocessed.
   */
  public getTranslation(
    key: string,
    options: {
      ns?: Namespace;
      namespace?: Namespace;
      namespaceSeparator?: NamespaceSeparator;
      keysSeparator?: KeysSeparator;
    },
  ) {
    const parent = this.translations;

    const keysSeparator =
      options?.keysSeparator ?? parent.options.keysSeparator;

    const accessor = getKey(
      key,
      options?.ns ?? options?.namespace ?? parent.options.defaultNamespace,
      options?.namespaceSeparator ?? parent.options.namespaceSeparator,
      keysSeparator,
    );

    if (!accessor) {
      return this.getFallbackValue(key);
    }

    const translation = this.findTranslation(accessor, keysSeparator);

    if (translation === undefined) {
      return this.getFallbackValue(accessor);
    }

    return translation;
  }

  /** @internal Responsible for the fallback mechanism. */
  private findTranslation(key: string, keysSeparator: KeysSeparator) {
    const parent = this.translations,
      translations = parent.translations;

    do {
      for (const locale of this.getLocalesOrder()) {
        const translation = translations[locale]?.get(key);

        if (translation !== undefined) {
          return translation;
        }
      }
    } while (
      parent.options.tooDeepKeys === "lastvalue" &&
      (key = S.beforeLast(key, keysSeparator))
    );

    return undefined;
  }

  /** @internal Returns the ordered list of locales to look for translations, starting from the current locale. */
  private getLocalesOrder() {
    const parent = this.translations,
      locale = parent.locale,
      fallback = parent.options.locales[locale]?.fallback;

    if (!fallback) {
      return [locale];
    }

    return [locale, ...fallback];
  }

  /** @internal Generates the fallback value for a missing translation. */
  private getFallbackValue(key: string) {
    return notFoundKeysHandlers[this.translations.options.notFoundKeys](
      key,
      this.translations,
    )!;
  }
}
