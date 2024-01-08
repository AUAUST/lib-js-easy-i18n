import { describe, test, expect } from "@jest/globals";
import { Translations, type TranslationsInit } from "~";

const translations: TranslationsInit["translations"] = {
  // Default locale; all keys present
  en: {
    ns: {
      name: "Name",
      age: "Age",
      address: {
        city: "City",
        country: "Country",
      },
    },
    // Used to ensure the fallbacks are looked up in the right order
    fallbackOrder: {
      all: "All",
      en: "En",
      enFr: "EnFr-En",
    },
  },
  // Secondary locale with all keys present
  // Also has a key that is not present in the default locale (not supposed to happen)
  fr: {
    ns: {
      name: "Nom",
      age: "Âge",
      language: "Langue",
      address: {
        city: "Ville",
        country: "Pays",
        canton: "Canton",
      },
    },
    fallbackOrder: {
      all: "Tous",
      fr: "Fr",
      enFr: "EnFr-Fr",
      frEs: "FrEs-Fr",
    },
  },
  // Secondary locale with some keys missing
  es: {
    ns: {
      name: "Nombre",
      address: {
        city: "Ciudad",
      },
    },
    fallbackOrder: {
      all: "Todos",
      es: "Es",
      frEs: "FrEs-Es",
      esDe: "EsDe-Es",
    },
  },
  // Secondary locale with no keys present
  de: {
    ns: {
      address: {},
    },
    fallbackOrder: {
      all: "Alle",
      de: "De",
      esDe: "EsDe-De",
    },
  },
};

describe("The default fallbacks strategy", () => {
  /**
   * JavaScript having no way of setting the order of object keys,
   * we set those locales as an array.
   *
   * As soon as the order is important to the user, the object format of locales
   * is no longer a good fit IF the user wants to use the default fallbacks strategy.
   * As soon as the user provides it own fallbacks array, it's fine.
   */

  const locales: TranslationsInit["locales"] = [
    {
      name: "English",
      locale: "en",
    },
    {
      name: "Français",
      locale: "fr",
    },
    {
      name: "Español",
      locale: "es",
    },
    {
      name: "Deutsch",
      locale: "de",
    },
  ];

  const init: TranslationsInit = {
    locale: "en",
    locales,
    translations,
    namespaces: "ns",
    invalidKeys: {
      notFound: "undefined", // This way we can check for `undefined` instead of invalid strings
    },
  };

  test("ensures no locale is set more than once", () => {
    // Otherwise a single locale would be looked up multiple times,
    // but if it gets looked up again it means it didn't have the key in the first place
    // so won't have it the second time either.
    const T = Translations.createSync({
      locales: [
        // {
        //   name: "Fr",
        // },
        "en",
        {
          name: "English",
          locale: "en",
        },
        "fr",
        {
          locale: "fr",
        },
      ],
    });

    expect(T.locales).toEqual(expect.arrayContaining(["fr", "en"]));
    expect(T.locales.length).toBe(2);
  });

  test("doesn't provide fallbacks for the default locale", () => {
    const { t } = Translations.createSync(init);

    // Ensure it works when valid
    expect(t("name")).toBe("Name");
    expect(t("address.city")).toBe("City");

    expect(t("language")).toBe(undefined); // Present in `fr`, but doesn't fallback
    expect(t("address.canton")).toBe(undefined); // Present in `fr`, but doesn't fallback
  });

  describe("generates fallbacks", () => {
    const T = Translations.createSync({
      ...init,
      locale: "en",
      locales: [
        {
          name: "English",
          locale: "en",
        },
        {
          name: "Français",
          locale: "fr",
          fallback: false,
        },
        {
          name: "Español",
          locale: "es",
        },
        {
          name: "Deutsch",
          locale: "de",
        },
      ],
    });

    test("using the order of the `locales` array", () => {
      // The order of locales being "en", "fr", "es", "de", the locales should fallback as:
      // "en": no fallbacks (default)
      // "fr": no fallbacks (explicitly disabled)
      // "es": "en", "fr", "de"
      // "de": "en", "fr", "es"
      T.switchLocaleSync("es");
      let { t } = T;

      expect(t("name", { ns: "ns" })).toBe("Nombre");

      expect(t("all", { ns: "fallbackOrder" })).toBe("Todos");
      expect(t("en", { ns: "fallbackOrder" })).toBe("En");
      expect(t("enFr", { ns: "fallbackOrder" })).toBe("EnFr-En");
      expect(t("frEs", { ns: "fallbackOrder" })).toBe("FrEs-Es");
      expect(t("esDe", { ns: "fallbackOrder" })).toBe("EsDe-Es");

      T.switchLocaleSync("de");
      ({ t } = T);

      expect(t("address.city", { ns: "ns" })).toBe("City");

      expect(t("all", { ns: "fallbackOrder" })).toBe("Alle");
      expect(t("en", { ns: "fallbackOrder" })).toBe("En");
      expect(t("enFr", { ns: "fallbackOrder" })).toBe("EnFr-En");
      expect(t("frEs", { ns: "fallbackOrder" })).toBe("FrEs-Fr");
    });

    test("except if explicitly disabled", () => {
      T.switchLocaleSync("fr");
      const { t } = T;

      expect(t("name")).toBe("Nom");
      expect(t("address.city")).toBe("Ville");

      expect(t("all", { ns: "fallbackOrder" })).toBe("Tous");
      expect(t("fr", { ns: "fallbackOrder" })).toBe("Fr");
      expect(t("en", { ns: "fallbackOrder" })).toBe(undefined);
    });
  });
});

describe("Custom fallbacks", () => {
  const locales: TranslationsInit["locales"] = {
    en: {
      name: "English",
      fallback: ["fr", "es", "de", "fr", "en"], // "fr" must be deduplicated and "en" must be ignored
    },
    fr: {
      name: "Français",
      fallback: false, // Explicitly disabled
    },
    es: {
      name: "Español",
      fallback: ["de"], // should not fallback to "fr" or "en"
    },
    de: {
      name: "Deutsch",
      // default fallbacks, ["en", "fr", "es"]
    },
  };

  const init: TranslationsInit = {
    locale: "en",
    locales,
    translations,
    namespaces: "fallbackOrder",
    invalidKeys: {
      notFound: "undefined", // This way we can check for `undefined` instead of invalid strings
    },
  };

  test("sanitizes the fallbacks input", () => {
    const T = Translations.createSync(init);

    expect(T.getLocaleConfig("en")!.fallback).toEqual(["fr", "es", "de"]); // "fr" deduplicated, "en" ignored
    expect(T.getLocaleConfig("fr")!.fallback).toBe(false);
    expect(T.getLocaleConfig("es")!.fallback).toEqual(["de"]); // valid in the first place
  });

  test("converts empty arrays to `false`", () => {
    const T = Translations.createSync({
      ...init,
      locales: {
        en: {
          fallback: [],
        },
      },
    });

    expect(T.getLocaleConfig("en")!.fallback).toBe(false);
  });

  test("do no prevent fallbacks from being generated on other locales", () => {
    const T = Translations.createSync(init);

    T.switchLocaleSync("de"); // "de" has no fallbacks on the init
    const { t } = T;

    expect(t("all")).toBe("Alle");

    // Can't test any fallback that's present in more than one locale because the order
    // of the fallbacks is not guaranteed (since object keys order is not guaranteed)
    // i.e. `t("enEs")` could be "EnEs-En" or "EnEs-Es"
    expect(t("es")).toBe("Es");
    expect(t("fr")).toBe("Fr");
    expect(t("en")).toBe("En");
  });
});
