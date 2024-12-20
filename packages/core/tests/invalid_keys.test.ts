import { describe, expect, test, vi } from "vitest";
import { Translations } from "../src/index.js";
import type { GenericNamespacedTranslations } from "../src/types/translations.js";
import type { TranslationsInit } from "../src/utils/translations_init.js";

// function translation
const fnT = vi.fn(({ name }: { name: string }) => {
  return `Hello ${name}`;
});

const translations = {
  namespace: {
    hello: "Hello",
    nested: {
      key: {
        path: "Real value",
      },
    },
    fnT,
  },
} satisfies GenericNamespacedTranslations;

const init: TranslationsInit = {
  locale: "en",
  namespaces: {
    default: "namespace",
  },
  translations: { en: translations },
};

describe("The `t` function", () => {
  test("has correct config defaults for invalid keys", () => {
    const { t } = new Translations({
      ...init,
    }).initSync();

    // Can't return an object by default (invalidKeys.tooShallow)
    expect(t()).toBe("");
    expect(t("nested.key")).toBe("Nested key");

    // Correct or too deep should return the last valid value (invalidKeys.tooDeep)
    expect(t("nested.key.path")).toBe("Real value");
    expect(t("nested.key.path.too.deep")).toBe("Real value");

    // Not found at all should return the key (invalidKeys.notFound)
    expect(t("unfound")).toBe("Unfound");
    expect(t("this.key.does.not.exist")).toBe("This key does not exist");
  });

  test("handles config options for not found keys", () => {
    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          notFound: "rawkey",
        },
      }).initSync();

      expect(t("unfound")).toBe("unfound");
      expect(t("")).toBe("");
      expect(t(":")).toBe("");
      expect(t("namespace:fooBar")).toBe("fooBar");
      expect(t("namespace:foo_bar")).toBe("foo_bar");
    }

    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          notFound: "empty",
        },
      }).initSync();

      expect(t("unfound")).toBe("");
      expect(t("")).toBe("");
      expect(t(":")).toBe("");
      expect(t("namespace:fooBar")).toBe("");
      expect(t("namespace:foo_bar")).toBe("");
    }

    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          notFound: "undefined",
        },
      }).initSync();

      expect(t("unfound")).toBe(undefined);
      expect(t("")).toBe(undefined);
      expect(t(":")).toBe(undefined);
      expect(t("namespace:fooBar")).toBe(undefined);
      expect(t("namespace:foo_bar")).toBe(undefined);
    }

    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          notFound: "prettykey",
        },
      }).initSync();

      expect(t("unfound")).toBe("Unfound");
      expect(t("")).toBe("");
      expect(t(":")).toBe("");
      expect(t("namespace:fooBar")).toBe("Foo bar");
      expect(t("namespace:foo_bar")).toBe("Foo bar");
    }
  });

  test("handles config options for too shallow keys", () => {
    const { t } = new Translations({
      ...init,
      invalidKeys: {
        tooShallow: "object",
      },
    }).initSync();

    expect(t()).toEqual(translations);
    expect(t("")).toEqual(translations);
    expect(t(":")).toEqual(translations.namespace);
    expect(t("namespace:")).toEqual(translations.namespace);
    expect(t("namespace:nested")).toEqual(translations.namespace.nested);
    expect(t("nested.key")).toEqual(translations.namespace.nested.key);
  });

  test("handles config options for too deep keys", () => {
    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          tooDeep: "lastvalue",
        },
      }).initSync();

      expect(t("nested.key.path.too.deep")).toEqual("Real value");
    }

    {
      const { t } = new Translations({
        ...init,
        invalidKeys: {
          tooDeep: "notfound",
        },
      }).initSync();

      expect(t("nested.key.path.too.deep")).toEqual("Nested key path too deep");
    }
  });
});
