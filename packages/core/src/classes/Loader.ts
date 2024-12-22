import { A } from "@auaust/primitive-kit";
import type { Store } from "~/classes/Store";
import type { Translations } from "~/classes/Translations";
import { Locale } from "~/types/config";
import type { Namespace } from "~/types/translations";

/**
 * This class is used by the `Store` class to load translations into the store.
 */
export class Loader {
  static from(translations: Translations, store: Store) {
    return new Loader(translations, store);
  }

  /** @internal The array of required namespaces to load. */
  private requiredNamespaces: Namespace[] | undefined;

  constructor(
    private translations: Translations,
    private store: Store,
  ) {}

  public getRequiredNamespaces() {
    return (this.requiredNamespaces ??= A.toDeduplicated(
      this.translations.options.requiredNamespaces,
    ));
  }

  /** Adds a new namespace to the list of required namespaces. Does not load it. */
  public requireNamespace(namespace: Namespace) {
    if (!this.getRequiredNamespaces().includes(namespace)) {
      this.getRequiredNamespaces().push(namespace);
    }
  }

  /** Adds a list of namespaces to the list of required namespaces. Does not load them. */
  public requireNamespaces(namespaces: Namespace[]) {
    for (const namespace of namespaces) {
      this.requireNamespace(namespace);
    }
  }

  /** Removes a namespace from the list of required namespaces. Does not remove any loaded translations. */
  public dropNamespace(namespace: Namespace) {
    const index = this.getRequiredNamespaces().indexOf(namespace);

    if (index !== -1) {
      this.getRequiredNamespaces().splice(index, 1);
    }
  }

  /** Removes multiple namespaces from the list of required namespaces. Does not remove any loaded translations. */
  public dropNamespaces(namespaces: Namespace[]) {
    for (const namespace of namespaces) {
      this.dropNamespace(namespace);
    }
  }

  /** Loads the required namespaces into the store. */
  public async loadRequiredNamespaces(locale?: Locale): Promise<boolean> {
    return await this.loadNamespaces(
      locale ?? this.translations.locale,
      this.getRequiredNamespaces(),
    );
  }

  /** Loads the given namespaces into the store. */
  public async loadNamespaces(
    locale: Locale,
    namespaces: Namespace[],
  ): Promise<boolean> {
    if (!namespaces?.length) {
      return false;
    }

    namespaces = A.toDeduplicated(namespaces).filter(
      (namespace) => !this.store.hasNamespace(locale, namespace),
    );

    if (namespaces.length === 0) {
      return true; // this is successful as all requested namespaces are already loaded
    }

    if (namespaces.length === 1) {
      return await this.loadNamespace(locale, A.first(namespaces));
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
            [namespace, await loadNamespace(locale, namespace)] as const,
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
    locale: Locale,
    namespace: Namespace,
  ): Promise<boolean> {
    if (!namespace) {
      return false;
    }

    if (this.store.hasNamespace(locale, namespace)) {
      return true;
    }

    const { loadNamespace, loadNamespaces } = this.translations.options;

    if (loadNamespace) {
      const result = await loadNamespace(locale, namespace);

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
