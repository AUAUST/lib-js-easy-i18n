import { describe, expect, test, vi } from "vitest";
import { Translations } from "~/index";
import type { GenericNamespacedTranslations } from "~/types/translations";
import type { TranslationsInit } from "~/utils/options/index";

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
    const { t } = Translations.from({
      ...init,
    }).initSync();

    // `notFoundKeys`'s default is `prettykey`
    expect(t()).toBe("");
    expect(t("unfound")).toBe("Unfound"); // not present in `translations`
    expect(t("nested.key")).toBe("Key"); // present but not deep enough
    expect(t("this.key.does.not.exist")).toBe("Exist"); // not present and deep

    // `tooDeepKeys`'s default is `lastvalue`
    expect(t("nested.key.path")).toBe("Real value"); // Real key
    expect(t("nested.key.path.too.deep")).toBe("Real value"); // Too deep key
  });

  test("handles `invalidKeys.notFound` set to `rawkey`", () => {
    const { t } = Translations.from({
      ...init,
      invalidKeys: {
        notFound: "rawkey",
      },
    }).initSync();

    expect(t("unfound")).toBe("unfound");
    expect(t("")).toBe("");
    expect(t(":")).toBe("");

    // Trims the namespace because it is known.
    expect(t("namespace:fooBar")).toBe("fooBar");
    expect(t("namespace:foo_bar")).toBe("foo_bar");

    // Doesn't trim the "namespace" `Here:` because it is not known, thus is considered part of the key.
    expect(
      t("Here: What using default translation... as the key looks like."),
    ).toBe("Here: What using default translation... as the key looks like.");
  });

  test("handles `invalidKeys.notFound` set to `empty`", () => {
    const { t } = Translations.from({
      ...init,
      invalidKeys: {
        notFound: "empty",
      },
    }).initSync();

    expect(t("unfound")).toBe("");
    expect(t("")).toBe("");
    expect(t(":")).toBe("");
    expect(t(":..")).toBe("");
    expect(t("namespace:fooBar")).toBe("");
    expect(t("foo_bar", { namespace: "namespace" })).toBe("");
  });

  test("handles `invalidKeys.notFound` set to `undefined`", () => {
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
  });

  test("handles `invalidKeys.notFound` set to `prettykey`", () => {
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
  });

  test("handles `invalidKeys.tooDeep` set to `lastvalue`", () => {
    const { t } = Translations.from({
      ...init,
      invalidKeys: {
        tooDeep: "lastvalue",
      },
    }).initSync();

    expect(t("nested.key.path")).toEqual("Real value");
    expect(t("nested.key.path.too.deep")).toEqual("Real value");
    expect(t("fnT.too.deep", { name: "Patrick" })).toEqual("Hello Patrick");
  });

  test("handles `invalidKeys.tooDeep` set to `notfound`", () => {
    const { t } = new Translations({
      ...init,
      invalidKeys: {
        tooDeep: "notfound",
      },
    }).initSync();

    expect(t("nested.key.path.too.deep")).toEqual("Deep");
    expect(t("fnT.too.deep", { name: "Patrick" })).toEqual("Deep");
  });
});
