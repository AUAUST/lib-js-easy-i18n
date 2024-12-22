import { A, O, S } from "@auaust/primitive-kit";
import { HasEvents } from "~/classes/HasEvents";
import { Store } from "~/classes/Store";
import { Translator } from "~/classes/Translator";
import type { Locale } from "~/types/config";
import type { TranslationsEvents } from "~/types/events";
import type { TranslateFunction } from "~/types/t";
import type {
  Namespace,
  NamespacedTranslations,
  NestedTranslationsRecord,
} from "~/types/translations";
import {
  getOptions,
  type TranslationsInit,
  type TranslationsOptions,
} from "~/utils/options/index";

export class Translations extends HasEvents<TranslationsEvents> {
  /** Same as calling the constructor with the options directly. */
  static from(init: TranslationsInit): Translations {
    return new Translations(init);
  }

  /**
   * Creates an instance of `Translations` with the given configuration and initializes it.
   * Return a promise that resolves when the instance is initialized and returns it.
   */
  static create(init: TranslationsInit): Promise<Translations> {
    return Translations.from(init).init();
  }

  /**
   * Creates an instance of `Translations` with the given configuration and initializes it.
   * Won't run any asynchronous logic, which means translations must be provided in the options directly to be available.
   */
  static createSync(init: TranslationsInit): Translations {
    return Translations.from(init).initSync();
  }

  /** @internal Holds the rew config until the instance is initialized. */
  private _init?: TranslationsInit;

  /** @internal Whether the instance has been initialized. */
  private initialized = false;

  /** @internal The parsed configuration. */
  // @ts-expect-error - We don't want to initialize the options in the constructor, but having `undefined` in the type is annoying.
  public options: TranslationsOptions;

  /** @internal The `Translator` instance in charge of the translation mechanism. */
  public translator: Translator;

  /** @internal The `Store` instance in charge of holding the data. */
  public store: Store;

  /** The translation function. */
  public t: TranslateFunction;

  constructor(init?: TranslationsInit) {
    super();
    this._init = O.is(init) ? init : {};
    this.translator = Translator.from(this);
    this.store = Store.from(this);

    // @ts-expect-error
    this.t = (...args) => this.translator.translate(...args);
    this.t.translations = this;
  }

  /** @internal Parses the options, initializes the instance and returns it. Contains the logic shared between `init` and `initSync`. */
  private beforeInit(callback?: TranslationsEvents["initialized"]) {
    if (this.initialized) return this;

    this.options = getOptions(this._init ?? {});

    if (this._init?.translations) {
      for (const locale in this._init.translations) {
        this.registerTranslations(locale, this._init.translations[locale]);
      }
    }

    callback && this.on("initialized", callback);

    delete this._init;

    this.initialized = true;

    return this;
  }

  /**
   * Initializes an instance of `Translations` with the configuration given in the constructor. It will load the initial namespaces.
   * If a callback is provided, it will be called when the instance is initialized.
   */
  public async init(callback?: TranslationsEvents["initialized"]) {
    if (this.initialized) return this;

    this.beforeInit(callback);

    await this.store.loadRequiredNamespaces(this.locale);

    this.emit("initialized", this);

    return this;
  }

  /**
   * Initializes an instance of `Translations` with the configuration given in the constructor.
   * It won't run any asynchronous logic, which means translations must be provided in the options directly to be available.
   * If a callback is provided, it will be called right after the instance is initialized.
   */
  public initSync(callback?: TranslationsEvents["initialized"]) {
    if (this.initialized) return this;

    this.beforeInit(callback);
    this.emit("initialized", this);

    return this;
  }

  /** A boolean whether the instance is initialized or not. */
  public get isInitialized() {
    return this.initialized;
  }

  /** The locale that's currently active on the instance. */
  public get locale(): Locale {
    return this.options.locale;
  }

  /** The locales that are allowed on the instance. */
  public get locales(): Locale[] {
    return O.keys(this.options.locales);
  }

  /** The default namespace. It is used by `t` if no namespace is specified. */
  public get defaultNamespace(): Namespace {
    return this.options.defaultNamespace;
  }

  /** @internal */
  private beforeSwitchLocale(newLocale: Locale): Locale | false | null {
    const oldLocale = this.locale;

    if (newLocale === oldLocale) {
      return null;
    }

    if (!this.locales.includes(newLocale)) {
      console.error(
        `Translations: Tried to switch to an invalid locale "${newLocale}"`,
      );

      return false;
    }

    this.options.locale = newLocale;

    return oldLocale;
  }

  /**
   * Switches the locale to the given locale.
   *
   * If the locale was successfully switched, it will return `true`.
   * If the locale is not allowed, it will ignore the request and return `false`.
   * If the locale is already active, it will ignore the request and return `null`.
   */
  public async switchLocale(newLocale: Locale) {
    const oldLocale = this.beforeSwitchLocale(newLocale); // Returns `false` if the locale is not allowed, `null` if it's already active, or the old locale if it's allowed.

    if (!oldLocale) {
      return oldLocale;
    }

    await this.loadRequiredNamespaces(newLocale);

    this.emit("locale_updated", this, newLocale, oldLocale);

    return true;
  }

  /**
   * Switches the locale to the given locale.
   * Won't run any asynchronous logic, which means translations must be already passed to the instance to be available.
   *
   * If the locale was successfully switched, it will return `true`.
   * If the locale is not allowed, it will ignore the request and return `false`.
   * If the locale is already active, it will ignore the request and return `null`.
   */
  public switchLocaleSync(newLocale: Locale) {
    newLocale = S.toLowerCase(newLocale);
    const oldLocale = this.locale;

    if (newLocale === oldLocale) return null;

    if (!this.locales.includes(newLocale)) {
      console.error(
        `Translations: Tried to switch to an invalid locale "${newLocale}"`,
      );
      return false;
    }

    this.options.locale = newLocale;

    this.emit("locale_updated", this, newLocale, oldLocale);

    return true;
  }

  public registerTranslations(
    locale: Locale,
    namespacedTranslations: Partial<NamespacedTranslations> | undefined,
  ): void;
  public registerTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: NestedTranslationsRecord,
  ): void;
  public registerTranslations(
    locale: Locale,
    namespaceOrTranslations:
      | Namespace
      | Partial<NamespacedTranslations>
      | undefined,
    translations?: NestedTranslationsRecord,
  ): void {
    if (S.is(namespaceOrTranslations)) {
      return this.store.addTranslations(
        locale,
        namespaceOrTranslations,
        translations,
      );
    }

    if (O.is(namespaceOrTranslations)) {
      for (const namespace in namespaceOrTranslations) {
        this.store.addTranslations(
          locale,
          namespace,
          namespaceOrTranslations[namespace],
        );
      }
    }
  }

  /** @internal Gets the list of all namespaces. This includes the default namespace, the required namespaces, and the loaded namespaces. */
  public getNamespaces(): Namespace[] {
    return A.from(this.store.getNamespaces());
  }

  /** Gets the list of the namespaces that are required to be loaded. */
  public getRequiredNamespaces() {
    return this.store.getRequiredNamespaces();
  }

  /** Requires the given namespaces to be loaded. */
  public async requireNamespace(namespace: Namespace) {
    this.store.requireNamespace(namespace);
    return this.loadRequiredNamespaces(this.locale);
  }

  /** Requires multiple namespaces to be loaded, and loads them. */
  public async requireNamespaces(...namespaces: (Namespace | Namespace[])[]) {
    this.store.requireNamespaces(namespaces.flat());
    return this.loadRequiredNamespaces(this.locale);
  }

  /** Removes a namespace from the list of required namespaces. Does not remove any loaded translations. */
  public dropNamespace(namespace: Namespace) {
    return this.store.dropNamespace(namespace);
  }

  /** Removes multiple namespaces from the list of required namespaces. Does not remove any loaded translations. */
  public dropNamespaces(...namespaces: (Namespace | Namespace[])[]) {
    return this.store.dropNamespaces(namespaces.flat());
  }

  /** Loads the required namespaces into the store for the given locale. */
  public async loadRequiredNamespaces(locale: Locale) {
    return await this.store.loadRequiredNamespaces(locale);
  }

  /** Loads the given namespaces into the store for the given locale. */
  public async loadNamespaces(locale: Locale, namespaces: Namespace[]) {
    return await this.store.loadNamespaces(locale, namespaces);
  }

  /** Loads the given namespace into the store for the given locale. */
  public async loadNamespace(locale: Locale, namespace: Namespace) {
    return await this.store.loadNamespaces(locale, [namespace]);
  }

  /** @internal Retrieves the raw translation from the store, but doesn't process it. */
  public getRawTranslation(locale: Locale, namespace: Namespace, key: string) {
    return this.store.getTranslation(locale, namespace, key);
  }
}
