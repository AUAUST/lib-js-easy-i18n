import { O, S } from "@auaust/primitive-kit";
import { HasEvents } from "~/classes/HasEvents";
import { Store } from "~/classes/Store";
import { Translator } from "~/classes/Translator";
import type { Locale } from "~/types/config";
import type { TranslationsEvents } from "~/types/events";
import type { Namespace } from "~/types/translations";
import {
  getOptions,
  type TranslationsInit,
  type TranslationsOptions,
} from "~/utils/options/index";

export class Translations extends HasEvents<TranslationsEvents> {
  /**
   * Creates an instance of `Translations` with the given configuration and initializes it.
   * Return a promise that resolves when the instance is initialized and returns it.
   */
  static create(init: TranslationsInit): Promise<Translations> {
    return new Translations(init).init();
  }

  /**
   * Creates an instance of `Translations` with the given configuration and initializes it.
   * Won't run any asynchronous logic, which means translations must be provided in the options directly to be available.
   */
  static createSync(init: TranslationsInit): Translations {
    return new Translations(init).initSync();
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

  constructor(init?: TranslationsInit) {
    super();
    this._init = O.is(init) ? init : {};
    this.translator = new Translator(this);
    this.store = new Store(this);
  }

  /** @internal Parses the options, initializes the instance and returns it. Contains the logic shared between `init` and `initSync`. */
  private beforeInit(callback?: TranslationsEvents["initialized"]) {
    if (this.initialized) return this;

    this.options = getOptions(this._init ?? {});

    callback && this.on("initialized", callback);

    delete this._init;

    this.initialized = true;

    return this;
  }

  /**
   * Initializes an instance of `Translations` with the configuration given in the constructor.
   * It will load the initial namespaces and generate the `t` function.
   *
   * If a callback is provided, it will be called when the instance is initialized.
   * It is the same as calling `on("initialized", callback)` before calling `init`.
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
   * Won't run any asynchronous logic, which means translations must be provided in the options directly to be available.
   *
   * If a callback is provided, it will be called right after the instance is initialized.
   * It is the same as calling `on("initialized", callback)` before calling `initSync`.
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

  public t(key: string, options: { ns?: Namespace }) {
    if (!this.translator) {
      throw new Error(
        "Translations: You must call `init` before being able to use `t`",
      );
    }

    return this.translator.translate(key, options);
  }

  /**
   * Switches the locale to the given locale.
   *
   * If the locale was successfully switched, it will return `true`.
   * If the locale is not allowed, it will ignore the request and return `false`.
   * If the locale is already active, it will ignore the request and return `null`.
   */
  public async switchLocale(newLocale: Locale) {
    newLocale = S.toLowerCase(newLocale);
    const oldLocale = this.locale;

    if (newLocale === oldLocale) return null;

    if (!this.locales.includes(newLocale)) {
      console.error(
        `Translations: Tried to switch to an invalid locale "${newLocale}"`,
      );
      return false;
    }

    await this.store.loadRequiredNamespaces(newLocale);
    this.options.locale = newLocale;

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

  public getRequiredNamespaces() {
    return this.store.getRequiredNamespaces();
  }

  public requireNamespace(namespace: Namespace) {
    return this.store.requireNamespace(namespace);
  }

  public dropNamespace(namespace: Namespace) {
    return this.store.dropNamespace(namespace);
  }

  public async loadNamespaces(namespaces: Namespace[], locale: Locale) {
    return await this.store.loadNamespaces(namespaces, locale);
  }

  public async loadNamespace(namespace: Namespace, locale: Locale) {
    return await this.store.loadNamespaces([namespace], locale);
  }
}
