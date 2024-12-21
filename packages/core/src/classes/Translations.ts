import { O, S } from "@auaust/primitive-kit";
import { HasEvents } from "~/classes/HasEvents";
import { Translator } from "~/classes/Translator";
import type { Locale, TranslationsSchema } from "~/types/config";
import type { TranslationsEvents } from "~/types/events";
import type {
  GenericNamespacedTranslations,
  Namespace,
  NestedTranslationsRecord,
} from "~/types/translations";
import {
  getOptions,
  type TranslationsInit,
  type TranslationsOptions,
} from "~/utils/options/index";
import { t } from "~/utils/t";

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

  /** @internal */
  private _isInitialized = false;
  /** @internal */
  private _init?: TranslationsInit;
  /** @internal */
  private _options: TranslationsOptions | undefined;
  /** @internal - The `Translator` instance in charge of the translation mechanism. */
  private translator: Translator | undefined;

  constructor(init?: TranslationsInit) {
    super();
    this._init = O.is(init) ? init : {};
  }

  /** @internal - Parses the options, initializes the instance and returns it. Contains the logic shared between `init` and `initSync`. */
  private beforeInit(callback?: TranslationsEvents["initialized"]) {
    if (this._isInitialized) return this;

    this._isInitialized = true;
    this._options = getOptions(this._init ?? {});
    this.translator = new Translator(this);

    callback && this.on("initialized", callback);

    delete this._init;

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
    if (this._isInitialized) return this;

    this.beforeInit(callback);
    this.addTranslations(
      this.locale,
      await this.loadRequiredNamespaces(this.locale),
    );
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
    if (this._isInitialized) return this;

    this.beforeInit(callback);
    this.emit("initialized", this);

    return this;
  }

  public t(key: string, options: { ns?: Namespace }) {
    if (!this.translator) {
      throw new Error(
        "Translations: You must call `init` before being able to use `t`",
      );
    }

    return this.translator.translate(key, options);
  }

  // private _t: TFunction | undefined;

  // get t(): TFunction {
  //   if (!this._t)
  //     throw new Error(
  //       "Translations: You must call `init` before being able to use `t`",
  //     );

  //   return this._t;
  // }

  /** @internal - Updates the `t` function to use the new state of the instance. */
  private updateTFunction() {
    this._t = t.bind({ ...this.options });
    this.emit("tChanged", this, this._t);
  }

  /** @internal */
  public get options() {
    if (!this._options)
      throw new Error(
        "Translations: Tried using Translations before calling `init`",
      );

    return this._options;
  }

  /** A boolean whether the instance is initialized or not. */
  public get isInitialized() {
    return this._isInitialized;
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

  /** All the translations that have been loaded. Includes all locales and namespaces. */
  public get translations() {
    return this.options.translations;
  }

  /**
   * A function based on the `loadNamespace` or `loadNamespaces` init options.
   * It can be called to request the loading of new namespaces using the provided logic.
   */
  public async loadNamespaces(
    ...args: Parameters<TranslationsOptions["loadNamespaces"]>
  ) {
    const lNs = await this.options.loadNamespaces(...args);

    // We keep track of the namespaces that are being loaded.
    // Useful later on with `loadRequiredNamespaces`, to automatically load the used namespaces on locale switch.
    const rNs = this.options.requiredNamespaces;
    rNs.push(...O.keys(lNs).filter((ns) => !rNs.includes(ns)));

    return lNs;
  }

  /**
   * Internal function used to add translations to the instance.
   * If translations are already present, it will merge them.
   */
  private addTranslations(
    locale: Locale,
    translations: GenericNamespacedTranslations | undefined,
  ) {
    if (!translations) return;

    if (!this.locales.includes(locale)) {
      console.error(
        `Translations: Tried to add translations for a locale that is not allowed: "${locale}"~`,
      );
      return false; // Not worth throwing an error.
    }

    /**
     * Merges the new translations into the current translations recursively.
     * A key already present in the current translations will have precedence.
     */
    function merge(
      original: NestedTranslationsRecord,
      extension: NestedTranslationsRecord,
    ) {
      for (const [key, value] of O.entries(extension)) {
        // If the value is an object, we need to merge it recursively only if the original value is also an object.
        if (O.is(value)) {
          if (O.is(original[key])) {
            merge(
              original[key] as TranslationsSchema,
              value as TranslationsSchema,
            );
          } else if (!original[key]) {
            original[key] = value;
          }
        }

        // Otherwise it's a translation, which we can set if it's not already there.
        else if (!original[key]) {
          original[key] = value;
        }
      }
    }

    const currentTranslations = (this.translations[locale] ??= {});

    for (const [rawNs, ts] of O.entries(translations)) {
      const ns = S.toLowerCase(rawNs);

      if (!currentTranslations[ns]) {
        currentTranslations[ns] = ts;
        continue;
      }

      merge(currentTranslations[ns]!, ts!);
    }
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

    const translations = await this.loadRequiredNamespaces(newLocale);

    this.options.locale = newLocale;

    // There might be no translations if all required namespaces were already loaded.
    // This doesn't mean that the locale switch failed.
    if (translations) {
      this.addTranslations(newLocale, translations);
    }

    this.updateTFunction();
    this.emit("localeChanged", this, newLocale, oldLocale);

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

    this.updateTFunction();
    this.emit("localeChanged", this, newLocale, oldLocale);

    return true;
  }

  /**
   * Provides a way to directly pass translations to the instance.
   * This is useful if you didn't set `loadNamespaces` or `loadNamespace` but still have translations to pass.
   *
   * You can either pass a namespace and its translations, or directly pass an object of namespaced translations.
   *
   * If all required namespaces are provided with this function, `loadNamespaces` and `loadNamespace` will never be called.
   */
  public registerTranslations(
    locale: Locale,
    namespace: Namespace,
    translations: TranslationsSchema,
  ): void;
  public registerTranslations(
    locale: Locale,
    translations: Partial<GenericNamespacedTranslations>,
  ): void;

  public registerTranslations(
    locale: Locale,
    namespaceOrTranslations: Namespace | GenericNamespacedTranslations,
    translations?: NestedTranslationsRecord,
  ) {
    locale = S.toLowerCase(locale);
    let namespacedTranslations: GenericNamespacedTranslations;

    if (!this.locales.includes(locale)) {
      console.error(
        `Translations: Provided translations for a locale that is not allowed: "${locale}"~`,
      );
      return; // Not worth throwing an error as it simply doesn't do anything.
    }

    if (S.isStrict(namespaceOrTranslations)) {
      if (!translations)
        throw new TypeError(
          "Translations: No translations provided to registerTranslations",
        );

      namespacedTranslations = {
        [S.toLowerCase(namespaceOrTranslations)]: translations,
      };
    } else {
      namespacedTranslations = namespaceOrTranslations;
    }

    this.addTranslations(locale, namespacedTranslations);

    this.updateTFunction();
  }

  /** @internal */
  private async loadRequiredNamespaces(locale: Locale) {
    const translations = this.translations[locale];
    let requiredNamespaces: Namespace[];

    if (!translations) {
      requiredNamespaces = this.options.requiredNamespaces;
    } else {
      requiredNamespaces = this.options.requiredNamespaces.filter(
        // We only want to load namespaces that are not already loaded.
        (ns) => !translations[ns],
      );
    }

    if (!requiredNamespaces.length) return undefined;

    const loadedTranslations = await this.loadNamespaces(
      locale,
      requiredNamespaces,
    );

    return loadedTranslations;
  }

  /**
   * A function that can be called to require the loading of new namespaces.
   * It's a declarative way to ensure the required namespaces are loaded at a given time.
   *
   * It returns a promise that resolves when the namespaces are loaded. The promise always resolves to `true`.
   * It can be used to await the loading of the namespaces.
   */
  public async requireNamespaces(
    ...ns: (Namespace | Namespace[])[]
  ): Promise<true> {
    const locale = this.locale,
      namespaces = ns.flat(Infinity).map(S.lower);

    this.options.requiredNamespaces.push(...namespaces); // Ensures later calls to `loadRequiredNamespaces` will load the new namespaces.

    const translations = await this.loadNamespaces(locale, namespaces);
    this.addTranslations(locale, translations);

    this.updateTFunction();

    return true;
  }

  /**
   * A function that can be called to no longer require the passed namespaces.
   *
   * It won't unload or remove the existing translations for the namespaces,
   * but will prevent them from being loaded again from a locale switch for example.
   *
   * This is useful if you need to scope certain namespaces to a specific part of your application.
   * This way, you can call `requireNamespaces` when you enter the scope and `dropNamespaces` when you leave it.
   */
  public dropNamespaces(...ns: (Namespace | Namespace[])[]): true {
    const namespaces = ns.flat(Infinity).map(S.lower);

    this.options.requiredNamespaces = this.options.requiredNamespaces.filter(
      (n) => !namespaces.includes(S.lower(n)),
    );

    return true;
  }
}
