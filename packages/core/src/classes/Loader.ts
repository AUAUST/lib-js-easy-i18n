import { A } from "@auaust/primitive-kit";
import type { Store } from "~/classes/Store";
import type { Translations } from "~/classes/Translations";
import { Locale } from "~/types/config";
import type { Namespace } from "~/types/translations";

/**
 * This class is used by the `Store` class to load translations into the store.
 */
export class Loader {
  /** @internal The array of required namespaces to load. */
  private requiredNamespaces: Namespace[];

  constructor(
    private translations: Translations,
    private store: Store,
  ) {
    this.requiredNamespaces = A.toDeduplicated(
      translations.options.requiredNamespaces,
    );
  }

  public getRequiredNamespaces() {
    return this.requiredNamespaces;
  }

  /** Adds a new namespace to the list of required namespaces. Does not load it. */
  public requireNamespace(namespace: Namespace) {
    if (!this.requiredNamespaces.includes(namespace)) {
      this.requiredNamespaces.push(namespace);
    }
  }

  /** Removes a namespace from the list of required namespaces. Does not remove any loaded translations. */
  public dropNamespace(namespace: Namespace) {
    const index = this.requiredNamespaces.indexOf(namespace);

    if (index !== -1) {
      this.requiredNamespaces.splice(index, 1);
    }
  }

  /** Loads the required namespaces into the store. */
  public async loadRequiredNamespaces(locale?: Locale): Promise<boolean> {
    return await this.loadNamespaces(
      this.requiredNamespaces,
      locale ?? this.translations.locale,
    );
  }

  /** Loads the given namespaces into the store. */
  public async loadNamespaces(
    namespaces: Namespace[],
    locale: Locale,
  ): Promise<boolean> {
    if (!namespaces?.length) {
      return false;
    }

    namespaces = A.toDeduplicated(namespaces).filter(
      (namespace) => !this.store.hasNamespace(namespace, locale),
    );

    if (namespaces.length === 0) {
      return true; // this is successful as all requested namespaces are already loaded
    }

    if (namespaces.length === 1) {
      return await this.loadNamespace(A.first(namespaces), locale);
    }

    const { loadNamespace, loadNamespaces } = this.translations.options;

    if (loadNamespaces) {
      const result = await loadNamespaces(locale, namespaces);

      if (!result) return false;

      for (const namespace of namespaces) {
        if (!result[namespace]) {
          continue;
        }

        this.store.addTranslations(locale, namespace, result[namespace]);
      }

      return true;
    }

    if (loadNamespace) {
      const results = await Promise.all(
        namespaces.map(
          async (namespace) =>
            [namespace, await loadNamespace(namespace, locale)] as const,
        ),
      );

      for (const [namespace, result] of results) {
        if (!result) {
          continue;
        }

        this.store.addTranslations(locale, namespace, result);
      }

      return true;
    }

    return false;
  }

  /** Loads the given namespace into the store. */
  private async loadNamespace(
    namespace: Namespace,
    locale: Locale,
  ): Promise<boolean> {
    if (!namespace) {
      return false;
    }

    if (this.store.hasNamespace(namespace, locale)) {
      return true;
    }

    const { loadNamespace, loadNamespaces } = this.translations.options;

    if (loadNamespace) {
      const result = await loadNamespace(namespace, locale);

      if (!result) {
        return false;
      }

      this.store.addTranslations(locale, namespace, result);

      return true;
    }

    if (loadNamespaces) {
      const result = await loadNamespaces(locale, [namespace]);

      if (!result || !result[namespace]) {
        return false;
      }

      this.store.addTranslations(locale, namespace, result[namespace]);
    }

    return false;
  }
}
