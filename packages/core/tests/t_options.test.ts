import { describe, test, expect, vi } from "vitest";
import { Translations, type TranslationsInit } from "../src/index.js";

const namespaceA = {
  string: "Hello",

  functionNoArgs: vi.fn(() => {
    return "FnA";
  }),
  functionArgs: vi.fn(({ name, age }: { name: string; age: number }) => {
    return `${name} is ${age}`;
  }),

  nsA: {
    nested: "Nested",
  },
};

const namespaceB = {
  string: "Hi",

  functionNoArgs: vi.fn(() => {
    return "FnB";
  }),
  functionArgs: vi.fn(
    ({ city, country }: { city: string; country: string }) => {
      return `${city} is in ${country}`;
    },
  ),

  nsB: {
    some: "Some",
  },
};

const init: TranslationsInit = {
  locale: "en",
  invalidKeys: {
    notFound: "undefined",
    tooDeep: "lastvalue",
    tooShallow: "object",
  },
  translations: {
    en: {
      namespaceA,
      namespaceB,
    },
  },
};

describe("The `t` function", () => {
  test("accepts the `ns` option", () => {
    const { t } = Translations.createSync(init);

    expect(t("string")).toBe(undefined);
    expect(t("namespaceA:string")).toBe("Hello");
    expect(t("string", { ns: "namespaceB" })).toBe("Hi");
  });

  test("runs function translations", () => {
    const { t } = Translations.createSync(init);

    expect(t("functionNoArgs", { ns: "namespaceA" })).toBe("FnA");
    expect(t("functionNoArgs", { ns: "namespaceB" })).toBe("FnB");

    expect(namespaceA.functionNoArgs).toHaveBeenCalledTimes(1);
  });

  test("passes arguments to function translations", () => {
    const { t } = Translations.createSync(init);

    expect(
      t("functionArgs", {
        ns: "namespaceA",
        arg: { name: "John", age: 30 },
      }),
    ).toBe("John is 30");
    expect(
      t("functionArgs", {
        ns: "namespaceB",
        arg: { city: "London", country: "UK" },
      }),
    ).toBe("London is in UK");

    expect(namespaceA.functionArgs).toHaveBeenCalledTimes(1);
    expect(namespaceB.functionArgs).toHaveBeenCalledWith({
      city: "London",
      country: "UK",
    });
  });
});
