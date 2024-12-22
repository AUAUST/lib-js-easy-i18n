import { describe, expect, test, vi } from "vitest";
import { Translations, type TranslationsInit } from "~/index";

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

  pluralizer: vi.fn((count: number) => {
    return count <= 1 ? "One" : "More";
  }),

  nsB: {
    some: "Some",
  },
};

const init: TranslationsInit = {
  locale: "en",
  invalidKeys: {
    notFound: "undefined",
    tooDeep: "lastvalue",
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

  test("accepts the `namespace` option", () => {
    const { t } = Translations.createSync(init);

    expect(t("string")).toBe(undefined);
    expect(t("string", { namespace: "namespaceA" })).toBe("Hello");
    expect(t("string", { namespace: "namespaceB" })).toBe("Hi");
  });

  test("gives priority to the namespace in the key, then `ns`, then `namespace`", () => {
    const { t } = Translations.createSync(init);

    expect(
      t("string", {
        ns: "namespaceA",
        namespace: "namespaceB",
      }),
    ).toBe("Hello");
    expect(t("namespaceA:string", { ns: "namespaceB" })).toBe("Hello");
    expect(t("namespaceA:string", { namespace: "namespaceB" })).toBe("Hello");
    expect(t("namespaceB:string", { ns: "namespaceA" })).toBe("Hi");
    expect(t("namespaceB:string", { namespace: "namespaceA" })).toBe("Hi");
  });

  test("runs function translations", () => {
    const { t } = Translations.createSync(init);

    expect(t("functionNoArgs", { ns: "namespaceA" })).toBe("FnA");
    expect(t("functionNoArgs", { ns: "namespaceB" })).toBe("FnB");

    expect(namespaceA.functionNoArgs).toHaveBeenCalledTimes(1);
  });

  describe("passes arguments to function translations", () => {
    test("when passed as `args`", () => {
      const { t } = Translations.createSync(init);

      expect(
        t("functionArgs", {
          ns: "namespaceA",
          args: { name: "John", age: 30 },
        }),
      ).toBe("John is 30");

      expect(
        t("functionArgs", {
          ns: "namespaceB",
          args: { city: "London", country: "UK" },
        }),
      ).toBe("London is in UK");

      expect(namespaceA.functionArgs).toHaveBeenCalledTimes(1);
      expect(namespaceB.functionArgs).toHaveBeenCalledWith({
        city: "London",
        country: "UK",
      });
    });

    test("when passed directly", () => {
      const { t } = Translations.createSync(init);

      expect(
        t("functionArgs", {
          ns: "namespaceA",
          name: "John",
          age: 30,
        }),
      ).toBe("John is 30");

      expect(
        t("functionArgs", {
          ns: "namespaceB",
          city: "London",
          country: "UK",
        }),
      ).toBe("London is in UK");
    });

    test("when passed a primitive via `args`", () => {
      const { t } = Translations.createSync(init);

      expect(
        t("pluralizer", {
          ns: "namespaceB",
          args: 1,
        }),
      ).toBe("One");

      expect(
        t("pluralizer", {
          ns: "namespaceB",
          args: 2,
        }),
      ).toBe("More");

      expect(namespaceB.pluralizer).toHaveBeenCalledTimes(2);
    });
  });
});
