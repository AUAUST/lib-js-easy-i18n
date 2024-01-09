import { Translations } from "@auaust/easy-i18n";
import {
  TranslationsProvider,
  useTranslations,
} from "@auaust/easy-i18n-adapter-solid";

export default function Home() {
  return (
    <main>
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
    </main>
  );
}
