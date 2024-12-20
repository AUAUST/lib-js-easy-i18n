import { describe, expect, test } from "vitest";
import { lowerCasedKeys } from "../src/utils/lowercased_keys.js";

describe("The `lowerCasedKeys` function", () => {
  test("lowercases keys at the first level by default", () => {
    expect(
      lowerCasedKeys({
        A: true,
        B: {
          C: true,
        },
        c: true,
      }),
    ).toEqual({
      a: true,
      b: {
        C: true,
      },
      c: true,
    });
  });

  test("lowercases keys to a specified depth", () => {
    expect(
      lowerCasedKeys(
        {
          A: true,
          B: {
            C: {
              D: true,
            },
          },
          c: true,
        },
        2,
      ),
    ).toEqual({
      a: true,
      b: {
        c: {
          D: true,
        },
      },
      c: true,
    });
  });

  test("lowercases keys to infinity", () => {
    expect(
      lowerCasedKeys(
        {
          A: {
            B: {
              C: {
                D: {
                  E: {
                    F: {
                      G: true,
                    },
                  },
                },
              },
            },
          },
        },
        Infinity,
      ),
    ).toEqual({
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: true,
                },
              },
            },
          },
        },
      },
    });
  });

  test("updates in place recursively", () => {
    const obj = {
      A: {
        B: {
          C: {
            D: {
              E: {
                F: {
                  G: true,
                },
              },
            },
          },
        },
      },
    };

    const result = lowerCasedKeys(obj, Infinity);

    expect(result).toBe(obj);
    expect((result as any).a.b.c.d.e.f.g).toBe(true);
    expect((result as any).A).toBeUndefined();
    expect((result as any).a.b.c.d).toBe((obj as any).a.b.c.d);
  });
});
