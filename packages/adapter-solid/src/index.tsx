import {
  Translations,
  type TranslateFunction,
  type TranslationsInit,
} from "@auaust/easy-i18n";
import { createContext, createSignal, useContext, type JSX } from "solid-js";

const TranslationsContext =
  createContext<ReturnType<typeof createTranslations>>();

const useTranslations = () => {
  const translations = useContext(TranslationsContext);

  if (!translations) {
    throw new Error(
      "Translations context is not defined. Please wrap your app with <TranslationsProvider />",
    );
  }

  return translations;
};

function TranslationsProvider(props: {
  init: TranslationsInit | Translations;
  children: JSX.Element;
}) {
  return (
    <TranslationsContext.Provider value={createTranslations(props.init)}>
      {props.children}
    </TranslationsContext.Provider>
  );
}

function createTranslations(init: TranslationsInit | Translations) {
  const instance =
    init instanceof Translations ? init : Translations.from(init);

  const [locale, setLocale] = createSignal<string>(
    instance.isInitialized ? instance.locale : undefined!,
  );

  const [t, setT] = createSignal(instance.t, { equals: false });

  instance.on("locale_updated", (_, newLocale) => {
    setLocale(newLocale);
    setT(() => instance.t);
  });

  if (!instance.isInitialized) {
    instance.init();
  }

  return {
    instance,
    locale,
    // @ts-ignore
    t: (...args) => t()(...args),
  } as {
    instance: Translations;
    locale: () => string;
    t: TranslateFunction;
  };
}

export { TranslationsProvider, useTranslations };
