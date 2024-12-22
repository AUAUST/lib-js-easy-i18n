import { S } from "@auaust/primitive-kit";
import { Translations } from "~/classes/Translations";
import type { KeysSeparator, NamespaceSeparator } from "~/types/config";
import type { Namespace } from "~/types/translations";
import { notFoundKeysHandlers } from "~/utils/options/getInvalidKeysOptions";

/**
 * This class is only responsible for the translation mechanism,
 * but not for the storage or loading of translations nor configuration.
 *
 * It keeps track of its parent `Translations` instance, which is the configuration provider.
 */
export class Translator {
  static from(translations: Translations) {
    return new Translator(translations);
  }

  constructor(private translations: Translations) {}

  public translate(
    key: string,
    options?: {
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
    options?: {
      ns?: Namespace;
      namespace?: Namespace;
    },
  ) {
    const parent = this.translations;

    const [namespace, k] = this.getNamespaceAndKey(
      key,
      options?.ns ?? options?.namespace ?? parent.options.defaultNamespace,
    );

    const translation = this.findTranslation(k, namespace);

    if (translation === undefined) {
      return this.getFallbackValue(k);
    }

    return translation;
  }

  /** @internal Responsible for the fallback mechanism. */
  private findTranslation(key: string, namespace: Namespace) {
    const parent = this.translations;

    do {
      for (const locale of this.getLocalesOrder()) {
        const translation = parent.getRawTranslation(locale, namespace, key);

        if (translation !== undefined) {
          return translation;
        }
      }
    } while (
      parent.options.tooDeepKeys === "lastvalue" &&
      (key = S.beforeLast(key, parent.options.keysSeparator))
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

  /** @internal Returns the namespace-less key and the namespace as a tuple. */
  private getNamespaceAndKey(
    key: string,
    namespace: Namespace,
  ): [Namespace, string] {
    const [beforeSeparator, afterSeparator] = S.splitFirst(
      key,
      this.translations.options.namespaceSeparator,
    );

    if (afterSeparator === "") {
      return [namespace, beforeSeparator];
    }

    return [beforeSeparator, afterSeparator];
  }
}
