import { describe, test, expect } from "@jest/globals";
import { Translations } from "~/index";
import { NestedRecord } from "~/types/utils";

describe("We can initialize a Translations instance", () => {
  describe("syncronously", () => {
    test("with the static `createSync` method", () => {
      const T = Translations.createSync({
        locale: "en",
        namespaces: {
          default: "namespace",
        },
        translations: {
          en: {
            namespace: {
              hello: "Hello",
            },
          },
        },
      });

      expect(T.t("hello")).toBe("Hello");
    });

    test("with `new` and `initSync`", () => {
      const T = new Translations({
        locale: "en",
        namespaces: {
          default: "namespace",
        },
        translations: {
          en: {
            namespace: {
              hello: "Hello",
            },
          },
        },
      }).initSync();

      expect(T.t("hello")).toBe("Hello");
    });
  });

  describe("asyncronously", () => {
    const loadTranslations = async (locale: string, namespace: string) => {
      const translations = {
        en: {
          namespace: {
            hello: "Hello",
          },
        },
      } as Record<string, Record<string, NestedRecord<string, string>>>;

      return translations[locale]?.[namespace];
    };

    test("with the static `create` method", async () => {
      const T = await Translations.create({
        locale: "en",
        namespaces: {
          default: "namespace",
          initial: ["namespace"],
        },
        loadNamespace: (locale, namespace) => {
          return loadTranslations(locale, namespace);
        },
      });

      expect(T.t("hello")).toBe("Hello");
    });

    test("with `new` and `init`", async () => {
      const T = new Translations({
        locale: "en",
        namespaces: {
          default: "namespace",
          initial: ["namespace"],
        },
        loadNamespace: (locale, namespace) => {
          return loadTranslations(locale, namespace);
        },
      });

      await T.init();

      expect(T.t("hello")).toBe("Hello");
    });
  });
});
