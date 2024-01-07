import { describe, test, expect, jest } from "@jest/globals";
import { Translations } from "~/index";

describe("Switching locale", () => {
  test("works synchronously", () => {
    const T = Translations.createSync({
      locale: "en",
      locales: ["en", "fr"],
      translations: {
        en: {
          ns: {
            hello: "Hello",
          },
        },
        fr: {
          ns: {
            hello: "Bonjour",
          },
        },
      },
    });

    expect(T.locale).toBe("en");
    expect(T.t("ns:hello")).toBe("Hello");

    T.switchLocaleSync("fr");

    expect(T.locale).toBe("fr");
    expect(T.t("ns:hello")).toBe("Bonjour");
  });

  test("works asynchronously", async () => {
    const loadNamespace = jest.fn(async (locale: string, namespace: string) => {
      const translations = {
        en: {
          ns: {
            hello: "Hello",
          },
        },
        fr: {
          ns: {
            hello: "Bonjour",
          },
        },
      };

      return (translations as any)[locale]?.[namespace];
    });

    const T = await Translations.create({
      locale: "en",
      locales: ["en", "fr"],
      namespaces: "ns",
      loadNamespace,
    });

    // Must have been called once with the default locale and namespace on initialization
    expect(loadNamespace).toHaveBeenCalledTimes(1);
    expect(loadNamespace).toHaveBeenLastCalledWith("en", "ns");

    expect(T.locale).toBe("en");
    expect(T.t("ns:hello")).toBe("Hello");

    await T.switchLocale("fr");

    // Must have been called once with the new locale and default namespace
    expect(loadNamespace).toHaveBeenCalledTimes(2);
    expect(loadNamespace).toHaveBeenLastCalledWith("fr", "ns");

    expect(T.locale).toBe("fr");
    expect(T.t("ns:hello")).toBe("Bonjour");
  });
});
