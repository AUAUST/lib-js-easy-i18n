import { describe, expect, test, vi } from "vitest";
import { Translations } from "../src/index.js";

describe("Events registry", () => {
  test("Translations registers and emits events", async () => {
    {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const T = new Translations({
        locales: ["en", "fr"],
      });
      T.on("localeChanged", callback1);
      T.initSync(callback2);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(T);

      T.switchLocaleSync("fr");

      expect(callback1).toHaveBeenCalledWith(T, "fr", "en");
    }

    {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      const T = new Translations({
        locales: ["en", "fr"],
        translations: {
          en: { translations: { hello: "Hello" } },
          fr: { translations: { hello: "Bonjour" } },
        },
      });

      T.on("localeChanged", callback1);
      await T.init(callback2);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(T);

      await T.switchLocale("fr");

      expect(callback1).toHaveBeenCalledWith(T, "fr", "en");
    }
  });

  test("Translations unregisters events", () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const T = new Translations({
      locale: "en",
      locales: ["en", "fr"],
    });

    T.on("localeChanged", callback1);
    T.on("localeChanged", callback2);

    T.initSync();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();

    T.switchLocaleSync("fr");

    expect(callback1).toHaveBeenCalledWith(T, "fr", "en");
    expect(callback2).toHaveBeenCalledWith(T, "fr", "en");

    T.off("localeChanged", callback1);

    T.switchLocaleSync("en");

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenLastCalledWith(T, "fr", "en");
    expect(callback2).toHaveBeenCalledTimes(2);
    expect(callback2).toHaveBeenLastCalledWith(T, "en", "fr");
  });
});
