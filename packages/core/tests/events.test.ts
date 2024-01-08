import { describe, test, expect, jest } from "@jest/globals";
import { on, off, emit } from "~/utils/events.ts";
import { Translations } from "~/index.ts";

describe("Events registry", () => {
  test("exports the required functions", () => {
    expect(typeof on).toBe("function");
    expect(typeof off).toBe("function");
    expect(typeof emit).toBe("function");
  });

  test("on() adds a callback to the store only once", () => {
    const store = {};
    const callback = () => {};

    on(store, "test", callback);

    expect(store).toEqual({
      test: new Set([callback]),
    });

    on(store, "test", callback);
    on(store, "test", callback);

    expect(store).toEqual({
      test: new Set([callback]),
    });
  });

  test("on() ignore invalid callbacks", () => {
    const store = {};

    const offCallbacks = [
      on(store, "test", null as any),
      on(store, "test", undefined as any),
      on(store, "test", {} as any),
      on(store, "test", [] as any),
      on(store, "test", 123 as any),
      on(store, "test", "test" as any),
    ];

    expect(store).toEqual({
      test: new Set(),
    });

    expect(offCallbacks.filter((fn) => fn() === false).length).toBe(
      offCallbacks.length,
    );
  });

  test("on() returns a function that removes the callback from the store on call", () => {
    const store = {};
    const callback = () => {};

    const offCallback = on(store, "test", callback);

    expect(store).toEqual({
      test: new Set([callback]),
    });

    offCallback();

    expect(store).toEqual({
      test: new Set(),
    });
  });

  test("off() removes a callback from the store", () => {
    const store = {};
    const callback = () => {};

    on(store, "test", callback);

    expect(store).toEqual({
      test: new Set([callback]),
    });

    off(store, "test", callback);

    expect(store).toEqual({
      test: new Set(),
    });
  });

  test("off() removes all callbacks from the store if no callback is passed", () => {
    const store = {};
    const callback1 = () => {};
    const callback2 = () => {};

    on(store, "test", callback1);
    on(store, "test", callback2);

    expect(store).toEqual({
      test: new Set([callback1, callback2]),
    });

    off(store, "test");

    expect(store).toEqual({});
  });

  test("off() returns a boolean indicating if the callback was actually removed", () => {
    const store = {};
    const callback1 = () => {};
    const callback2 = () => {};

    on(store, "test", callback1);

    expect(store).toEqual({
      test: new Set([callback1]),
    });

    expect(off(store, "test", callback1)).toBe(true);
    expect(off(store, "test", callback2)).toBe(false);
    expect(off(store, "never-registered", callback2)).toBe(false);

    expect(store).toEqual({
      test: new Set(),
    });
  });

  test("emit() calls all callbacks for the given event", () => {
    const store = {};
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    on(store, "test", callback1);

    on(store, "test", callback2);
    on(store, "test", callback2);
    on(store, "test", callback2);
    on(store, "test", callback2);

    emit(store, "test", ["arg1", "arg2"]);

    expect(callback1).toHaveBeenCalledWith("arg1", "arg2");
    expect(callback2).toHaveBeenCalledWith("arg1", "arg2");
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test("on(), off() and emit() are case insensitive", () => {
    const store = {};
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    on(store, "test", callback1);

    on(store, "test", callback2);
    on(store, "Test", callback2);
    on(store, "TEST", callback2);

    expect(store).toEqual({
      test: new Set([callback1, callback2]),
    });

    emit(store, "TEST", ["arg1", "arg2"]);

    expect(callback1).toHaveBeenCalledWith("arg1", "arg2");
    expect(callback2).toHaveBeenCalledWith("arg1", "arg2");
    expect(callback2).toHaveBeenCalledTimes(1);

    off(store, "TEST", callback1);
    off(store, "TEST", callback2);

    emit(store, "tesT", ["arg1", "arg2"]);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  test("Translations registers and emits events", async () => {
    {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

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
      const callback1 = jest.fn();
      const callback2 = jest.fn();

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
});
