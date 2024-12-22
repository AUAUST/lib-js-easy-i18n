import { A, O, S } from "@auaust/primitive-kit";
import { Loader } from "~/classes/Loader";
import type { Translations } from "~/classes/Translations";
import type { Locale } from "~/types/config";
import type {
  Namespace,
  NestedTranslationsRecord,
  TranslationsStore,
} from "~/types/translations";
import { TranslationsMap } from "~/utils/translations";

/**
 * This class is only responsible for the storage and loading of translations,
 * but not for the translation mechanism nor configuration.
 *
 * It keeps track of its parent `Translations` instance, which is the configuration provider.
 */
export class Store {
  static from(translations: Translations) {
    return new Store(translations);
  }

  /** @internal A record of locales to records of namespaces to translations. */
  private store: TranslationsStore = {};

  /** @internal A `Loader` instance that holds the logic to load translations into the store. */
  private loader: Loader;

  /** @internal The map of namespaces to the number of times they are required or loaded. */
  private namespaces: Map<Namespace, number> = new Map();

  constructor(private translations: Translations) {
    this.loader = Loader.from(this.translations, this);
  }

  /** Returns whether the store has any translations for the given locale. */
  public hasLocale(locale: Locale) {
    locale = S.lower(locale);

    return O.is(this.store[locale]);
  }

  /** Returns whether the store has any translations for the given namespace. */
  public hasNamespace(locale: Locale | undefined, namespace: Namespace) {
    locale = S.lower(locale ?? this.translations.locale);
    namespace = S.lower(namespace);

    return O.is(this.store[locale]?.[namespace]);
  }

  /** Returns the translation for the given locale, namespace, and key. */
  public getTranslation(
    locale: Locale | undefined,
    namespace: Namespace,
    key: string,
  ) {
    locale = S.lower(locale ?? this.translations.locale);
    namespace = S.lower(namespace);

    return this.store[locale]?.[namespace]?.get(key);
  }

  /** Registers the translations into the store under the given locale and namespace. */
  public addTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: NestedTranslationsRecord | undefined,
  ) {
    if (!O.is(translations)) return;

    locale = S.lower(locale);
    namespace = S.lower(namespace);

    if (!this.hasLocale(locale)) {
      this.store[locale] = {};
    }

    if (!this.hasNamespace(namespace, locale)) {
      this.store[locale]![namespace] = new Map();
    }

    this.incrementNamespace(namespace);

    this.addTranslationsRecursively(
      this.store[locale]![namespace]!,
      translations,
      "",
      this.translations.options.keysSeparator,
    );
  }

  /** Lists all the namespaces that are present in the store. */
  public getNamespaces() {
    const map = this.namespaces;
    return A(map.keys()).filter((namespace) => map.get(namespace)! > 0);
  }

  /** @internal Increments the count of the given namespace. */
  private incrementNamespace(namespaces: Namespace | Namespace[]) {
    if (!A.is(namespaces)) {
      namespaces = [namespaces];
    }

    for (const namespace of namespaces) {
      this.namespaces.set(namespace, (this.namespaces.get(namespace) || 0) + 1);
    }
  }

  /** @internal Decrements the count of the given namespace. */
  private decrementNamespace(namespaces: Namespace | Namespace[]) {
    if (!A.is(namespaces)) {
      namespaces = [namespaces];
    }

    for (const namespace of namespaces) {
      this.namespaces.set(namespace, (this.namespaces.get(namespace) || 1) - 1);
    }
  }

  /** @internal Recursively registers the translations into the store, flattening the keys. */
  private addTranslationsRecursively(
    map: TranslationsMap,
    translations: NestedTranslationsRecord,
    prefix: string,
    keysSeparator: string,
  ) {
    for (const [part, value] of O.entries(translations)) {
      const key = `${prefix}${part}`;

      switch (typeof value) {
        case "string":
        case "function":
        case "number": // While not officially supported, it makes no arm to support numbers.
          // TODO: Here, pass the value through a "processor" that takes care of plugins
          map.set(key, value);
          break;
        case "object":
          if (value === null) break;
          this.addTranslationsRecursively(
            map,
            value,
            `${key}${keysSeparator}`,
            keysSeparator,
          );
          break;
      }
    }
  }

  public getRequiredNamespaces() {
    return this.loader.getRequiredNamespaces();
  }

  public requireNamespace(namespace: Namespace) {
    this.incrementNamespace(namespace);

    return this.loader.requireNamespace(namespace);
  }

  public requireNamespaces(namespaces: Namespace[]) {
    for (const namespace of namespaces) {
      this.incrementNamespace(namespace);
    }

    return this.loader.requireNamespaces(namespaces);
  }

  public dropNamespace(namespace: Namespace) {
    this.decrementNamespace(namespace);

    return this.loader.dropNamespace(namespace);
  }

  public dropNamespaces(namespaces: Namespace[]) {
    for (const namespace of namespaces) {
      this.decrementNamespace(namespace);
    }

    return this.loader.dropNamespaces(namespaces);
  }

  public async loadRequiredNamespaces(locale?: Locale) {
    return await this.loader.loadRequiredNamespaces(locale);
  }

  public async loadNamespaces(locale: Locale, namespaces: Namespace[]) {
    for (const namespace of namespaces) {
      this.incrementNamespace(namespace);
    }

    return await this.loader.loadNamespaces(locale, namespaces);
  }

  public async loadNamespace(locale: Locale, namespace: Namespace) {
    this.incrementNamespace(namespace);

    return await this.loader.loadNamespaces(locale, [namespace]);
  }
}
