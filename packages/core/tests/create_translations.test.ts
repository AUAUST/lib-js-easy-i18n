import { describe, test, expect } from "vitest";
import { Translations } from "~";

describe("We can initialize a Translations instance", () => {
  test("without any options", () => {
    const T = new Translations().initSync();

    expect(T.locale).toBe("default");
    expect(T.defaultNamespace).toBe("translations");
    expect(T.t()).toBe(""); // If `t()` returns an empty string, it means it was correctly initialized

    T.registerTranslations("default", {
      // translations is the default namespace when none is specified
      translations: {
        hello: "Ciao!",
      },
      ns1: {
        hello: "Hello!",
      },
      ns2: {
        hello: "Hi!",
      },
    });

    expect(T.t("hello")).toBe("Ciao!");
    expect(T.t("ns1:hello")).toBe("Hello!");
    expect(T.t("ns2:hello")).toBe("Hi!");
  });

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
      };

      return (translations as any)[locale]?.[namespace];
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
