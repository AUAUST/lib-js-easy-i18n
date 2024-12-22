import { Translations, type Translation } from "@auaust/easy-i18n";
import {
  TranslationsProvider,
  useTranslations,
} from "@auaust/easy-i18n-adapter-solid";

declare module "@auaust/easy-i18n" {
  interface TranslationsConfig {
    defaultNamespace: "translations";
  }
  interface RegisteredTranslations {
    translations: {
      hello: Translation;
    };
    ns: {
      hello: Translation;
    };
  }
}

export default function Home() {
  return (
    <main>
      <pre>Translations.createSync()</pre>
      <TranslationsProvider
        init={Translations.createSync({
          locale: "en",
          translations: {
            en: {
              translations: {
                hello: "Hello World!",
              },
            },
          },
        })}
      >
        {useTranslations().t("hello")}
      </TranslationsProvider>
      <hr />
      <pre>init object &#123;&#125;</pre>
      <TranslationsProvider
        init={{
          locale: "en",
          namespaces: { default: "ns" },
          translations: {
            en: {
              ns: {
                hello: "Greetings!",
              },
            },
          },
        }}
      >
        {useTranslations().t("hello")}
      </TranslationsProvider>
      <hr />
      <pre>new Translations()</pre>
      <TranslationsProvider
        init={Translations.from({
          locale: "en",
          async loadNamespace() {
            return {
              hello: "Hello for the third time!",
            };
          },
        })}
      >
        {useTranslations().t("hello")}
      </TranslationsProvider>
      <hr />
      <pre>Nested component + reactivity</pre>
      <TranslationsProvider
        init={Translations.createSync({
          locales: ["en", "fr", "es", "de"],
          translations: {
            en: {
              translations: {
                hello: "Hello World!",
              },
            },
            fr: {
              translations: {
                hello: "Bonjour le monde!",
              },
            },
            es: {
              translations: {
                hello: "Hola Mundo!",
              },
            },
            de: {
              translations: {
                hello: "Hallo Welt!",
              },
            },
          },
        })}
      >
        <ReactiveTranslations />
      </TranslationsProvider>
    </main>
  );
}

function ReactiveTranslations() {
  const { t, instance, locale } = useTranslations();

  const locales = instance.locales;
  const max = locales.length - 1;
  let index = 0;

  setInterval(() => {
    index = index === max ? 0 : index + 1;
    instance.switchLocaleSync(locales[index]);
  }, 1000);

  return (
    <div>
      {locale().toUpperCase()}: {t("hello")}
    </div>
  );
}
