import { describe, expect, test, vi } from "vitest";
import {
  Translations,
  type Locale,
  type Namespace,
  type NestedTranslationsRecord,
} from "~/index";

describe("Translations instances", () => {
  const _loadNamespace = async (locale: Locale, namespace: Namespace) => {
    const translations = {
      en: {
        global: { hello: "Hello" },
        auth: { login: "Login" },
        errors: { notFound: "Not found" },
        contact: { email: "Email" },
        legal: { terms: "Terms" },
      },
      fr: {
        global: { hello: "Bonjour" },
        auth: { login: "Connexion" },
        errors: { notFound: "Introuvable" },
        contact: { email: "Email" },
        legal: { terms: "Conditions" },
      },
      de: {
        global: { hello: "Hallo" },
        auth: { login: "Anmeldung" },
        errors: { notFound: "Nicht gefunden" },
        contact: { email: "Email" },
        legal: { terms: "Bedingungen" },
      },
    } as Record<Locale, Record<Namespace, NestedTranslationsRecord>>;

    return translations[locale]?.[namespace];
  };

  test("take care of loading the initial namespaces", async () => {
    const loadNamespace = vi.fn(_loadNamespace);
    const T = await Translations.create({
      locale: "en",
      namespaces: {
        default: "global",
        required: ["errors", "auth"],
      },
      loadNamespace,
    });

    expect(loadNamespace).toHaveBeenCalledTimes(3); // 2 initial + 1 default
    expect(loadNamespace).toHaveBeenCalledWith("en", "errors");
    expect(loadNamespace).toHaveBeenCalledWith("en", "auth");
    expect(loadNamespace).toHaveBeenCalledWith("en", "global");

    expect(T.t("global:hello")).toBe("Hello");
    expect(T.t("errors:notFound")).toBe("Not found");
    expect(T.t("auth:login")).toBe("Login");
  });

  describe("allow to require namespaces", async () => {
    const loadNamespace = vi.fn(_loadNamespace);
    const T = await Translations.create({
      locale: "en",
      locales: {
        en: { fallback: false },
        fr: { fallback: false },
        de: { fallback: false },
      },
      invalidKeys: {
        notFound: "undefined",
      },
      namespaces: {
        default: "global",
      },
      loadNamespace,
    });

    test("and load them automatically", async () => {
      expect(loadNamespace).toHaveBeenCalledTimes(1);
      expect(T.t("auth:login")).toBe(undefined); // Namespace not loaded yet

      T.requireNamespaces("auth", "errors");

      expect(loadNamespace).toHaveBeenCalledTimes(3);
      expect(loadNamespace).toHaveBeenCalledWith("en", "auth");
      expect(loadNamespace).toHaveBeenCalledWith("en", "errors");
      expect(T.t("auth:login")).toBe("Login");
    });

    test("and load them automatically after a locale change", async () => {
      await T.switchLocale("fr");

      expect(loadNamespace).toHaveBeenCalledTimes(6); // 3 for initial locale + 3 for new locale
      expect(loadNamespace).toHaveBeenCalledWith("fr", "auth");
      expect(loadNamespace).toHaveBeenCalledWith("fr", "errors");
      expect(T.t("auth:login")).toBe("Connexion");
    });

    test("and then drop them", async () => {
      T.dropNamespaces("auth");
      await T.switchLocale("de");

      expect(loadNamespace).toHaveBeenCalledTimes(8); // 6 for initial locales + 2 for new locale
      expect(loadNamespace).toHaveBeenCalledWith("de", "global");
      expect(loadNamespace).toHaveBeenCalledWith("de", "errors");
      expect(loadNamespace).not.toHaveBeenCalledWith("de", "auth");
      expect(T.t("global:hello")).toBe("Hallo");
      expect(T.t("auth:login")).toBe(undefined);
    });
  });
});
