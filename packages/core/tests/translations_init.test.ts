/**
 * This suite tests the correct converting of a TranslationsInit object to a TranslationsConfig object.
 */
import { describe, test, expect, jest } from "@jest/globals";
import {
  getOptions,
  type TranslationsInit,
  type TranslationsOptions,
} from "~/utils/translations_init";

describe("The `getOptions` helper", () => {
  test("has correct config defaults when no options are provided", () => {
    const options = getOptions({});

    expect(options).toEqual(
      expect.objectContaining({
        locale: "default",
        localesDefinitions: {
          default: {
            name: "default",
            locale: "default",
            fallback: false,
          },
        },

        defaultNamespace: "translations",
        requiredNamespaces: ["translations"],
        loadNamespaces: expect.any(Function),

        keysSeparator: ".",
        namespaceSeparator: ":",

        notFoundKeys: "prettykey",
        tooDeepKeys: "lastvalue",
        tooShallowKeys: "notfound",
      }),
    );
  });

  test("case-insensitively handle the string options", () => {
    const options = getOptions({
      locales: "EN",
      invalidKeys: {
        // @ts-expect-error // TS don't have an easy way of case-insensitive the keys and making a union of all possible cases is not worth it
        notFound: "rawKey",
        // @ts-expect-error
        tooDeep: "lastValue",
        // @ts-expect-error
        tooShallow: "notFound",
      },
      namespaces: {
        default: "NameSpace",
        initial: ["REQUIRED", "IMPORTANT"],
      },
    });

    expect(options).toEqual(
      expect.objectContaining({
        locale: "en",
        localesDefinitions: {
          en: {
            name: "en",
            locale: "en",
            fallback: false,
          },
        },

        defaultNamespace: "namespace",
        requiredNamespaces: ["namespace", "required", "important"],

        keysSeparator: ".",
        namespaceSeparator: ":",

        notFoundKeys: "rawkey",
        tooDeepKeys: "lastvalue",
        tooShallowKeys: "notfound",
      }),
    );
  });

  describe("generates correct `localesDefinitions`", () => {
    test("when `locales` is a string", () => {
      const optionsA = getOptions({
        locales: "en",
      });

      expect(optionsA.localesDefinitions).toEqual({
        en: {
          name: "en",
          locale: "en",
          fallback: false,
        },
      });

      expect(optionsA.locale).toBe("en");

      const optionsB = getOptions({
        locale: "en",
      });

      expect(optionsB.localesDefinitions).toEqual(optionsA.localesDefinitions);

      // If present, `locales` takes precedence over `locale`
      const optionsC = getOptions({
        locale: "fr",
        locales: "en",
      });

      expect(optionsC.localesDefinitions).toEqual(optionsA.localesDefinitions);
    });

    test("when `locales` is an array", () => {
      const options = getOptions({
        locale: "en",
        locales: [
          "en",
          {
            locale: "fr",
            name: "Français",
          },
        ],
      });

      expect(options.locale).toBe("en"); // because it's the first one
      expect(options.localesDefinitions).toEqual({
        en: {
          name: "en",
          locale: "en",
          fallback: false,
        },
        fr: {
          name: "Français",
          locale: "fr",
          fallback: ["en"],
        },
      });
    });

    test("when `locales` is an object", () => {
      const options = getOptions({
        locales: {
          en: "English",
          fr: {
            name: "Français",
          },
        },
      });
    });
  });
});
