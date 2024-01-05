import { describe, test, expect } from "@jest/globals";
import { parseKey } from "~/t";

describe("The `t` function's key parser", () => {
  const config = {
    keysSeparator: ".",
    namespaceSeparator: ":",
    defaultNamespace: "default",
  };

  test("handles the intended usage", () => {
    {
      const { ns, rawKey, segments } = parseKey(config, "namespace:key");

      expect(ns).toBe("namespace");
      expect(rawKey).toBe("key");
      expect(segments).toEqual(["key"]);
    }

    {
      const { ns, rawKey, segments } = parseKey(config, "namespace:foo.bar");

      expect(ns).toBe("namespace");
      expect(rawKey).toBe("foo.bar");
      expect(segments).toEqual(["foo", "bar"]);
    }
  });

  test("handles invalid usage", () => {
    {
      // Namespace both in options and in key (priority to key)
      const { ns, rawKey, segments } = parseKey(config, "namespace:foo.bar", {
        ns: "other",
      });

      expect(ns).toBe("namespace");
      expect(rawKey).toBe("foo.bar");
      expect(segments).toEqual(["foo", "bar"]);
    }
  });

  {
    // Empty key
    const { ns, rawKey, segments } = parseKey(config, "");

    expect(ns).toBe("default");
    expect(rawKey).toBe("");
    expect(segments).toEqual(false);
  }

  {
    // Keeps intact spaces next to separators (weird design choice to use this, but )
    const { ns, rawKey, segments } = parseKey(config, " : foo . bar ", {
      ns: "any",
    });

    expect(ns).toBe(" ");
    expect(rawKey).toBe(" foo . bar ");
    expect(segments).toEqual([" foo ", " bar "]);
  }

  {
    // Only namespace
    const { ns, rawKey, segments } = parseKey(config, "namespace:");

    expect(ns).toBe("namespace");
    expect(rawKey).toBe("");
    expect(segments).toEqual(false);
  }

  {
    // Only namespace separator
    const { ns, rawKey, segments } = parseKey(config, ":");

    expect(ns).toBe("default");
    expect(rawKey).toBe("");
    expect(segments).toEqual(false);
  }

  {
    // Only keys separator
    // TODO: Make a choice on this. This feels overly bad, but what would be a proper handling?
    const { ns, rawKey, segments } = parseKey(config, ".");

    expect(ns).toBe("default");
    expect(rawKey).toBe(".");
    expect(segments).toEqual(["", ""]);
  }

  {
    // Multiple namespace separators
    // The first one only is used as namespace and later ones ignored
    // Not an invalid usage per se, but definitely something that's be surprising
    // This also means a key containing a namespace separator MUST include the namespace directly
    // (otherwise, the whole key before the first separator would be used as namespace)
    const { ns, rawKey, segments } = parseKey(
      config,
      "namespace:foo:bar.meep.moop:map",
    );

    expect(ns).toBe("namespace");
    expect(rawKey).toBe("foo:bar.meep.moop:map");
    expect(segments).toEqual(["foo:bar", "meep", "moop:map"]);
  }

  {
    // Same separator for both
    // This one would be justifiable if one just don't like namespaces
    // Tho brings a bunch of edge cases, i.e. it's impossible to have a "single-segment" key
    // as it'd add the default namespace to it

    // TODO: Maybe make an check on the config init handler to enable a "no namespaces" mode ?
    // It'd need to be considered on the key parser and the t function while looking for the key
    const { ns, rawKey, segments } = parseKey(
      {
        namespaceSeparator: ".",
        keysSeparator: ".",
        defaultNamespace: "default",
      },
      "namespace.foo.bar",
    );

    expect(ns).toBe("namespace");
    expect(rawKey).toBe("foo.bar");
    expect(segments).toEqual(["foo", "bar"]);
  }
});
