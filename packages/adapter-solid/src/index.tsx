import { createSignal, createContext, useContext, type JSX } from "solid-js";
import {
  Translations,
  type TranslationsInit,
  type TFunction,
} from "@auaust/easy-i18n";

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
  const instance = init instanceof Translations ? init : new Translations(init);

  const [tFunction, setTFunction] = createSignal<TFunction>(
    instance.isInitialized ? instance.t : () => "",
  );
  const [locale, setLocale] = createSignal<string>(
    instance.isInitialized ? instance.locale : undefined!,
  );

  instance.on("tChanged", (_, newT) => {
    setTFunction(() => newT);
  });

  instance.on("localeChanged", (_, newLocale) => setLocale(newLocale));

  if (!instance.isInitialized) {
    instance.init();
  }

  return {
    instance,
    locale,
    t: ((...args: Parameters<TFunction>) => tFunction()(...args)) as TFunction,
  };
}

export { useTranslations, TranslationsProvider };
