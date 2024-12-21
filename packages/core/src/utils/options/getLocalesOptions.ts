import { A, O, S } from "@auaust/primitive-kit";
import type { Locale } from "~/types/config";
import type {
  LocaleDefinition,
  LocaleDefinitionInit,
} from "~/types/translations";
import type { TranslationsInit, TranslationsOptions } from "~/utils/options";

/**
 * Returns the current locale and a array of locale definitions.
 */
export function getLocalesOptions(
  init: TranslationsInit,
): Pick<TranslationsOptions, "locale" | "locales"> {
  const localeInit = init.locale;
  const localesInit = init.locales;

  if (!localesInit) {
    if (localeInit) {
      return {
        locale: localeInit,
        locales: {
          [localeInit]: getLocaleDefinition(localeInit, undefined),
        },
      };
    }

    return {
      locale: "default",
      locales: {
        default: getLocaleDefinition("default", undefined),
      },
    };
  }

  const { locale, locales, definitionsInit } = (() => {
    // We only get a string, which means we only have a single locale with no additional settings.
    if (S.is(localesInit)) {
      const locale = localesInit.toLowerCase();

      return {
        locale,
        locales: [locale],
        definitionsInit: [
          {
            locale,
          },
        ],
      };
    }

    let locale: Locale;
    let locales: Locale[];
    let definitionsInit: LocaleDefinitionInit[];

    // If we get an array, each entry might be a string (locale) or an object (partial locale definition).
    if (A.isArray(localesInit)) {
      locale = localeInit
        ? S.toLowerCase(localeInit) // If a locale is provided, use it
        : S.is(localesInit[0]) // Otherwise, use the first locale in the array
          ? localesInit[0].toLowerCase() // If it's a string, use it
          : S.is(localesInit[0]!.locale) // Otherwise check for the `locale` prop
            ? S.toLowerCase(localesInit[0]!.locale)
            : S.toSnakeCase(localesInit[0]!.name); // If there's no `locale` prop, use the `name` prop

      if (!locale) {
        throw new Error(
          `Translations: A locale definition must include either a locale or a name.`,
        );
      }

      definitionsInit = localesInit.map((l) => (S.is(l) ? { locale: l } : l));

      locales = definitionsInit.map((l) => l.locale!.toLowerCase());
    } else {
      const keys = O.keys(localesInit);

      definitionsInit = keys.map((locale) => {
        const init = localesInit[locale]!;

        if (S.is(init)) {
          return {
            locale: S.toLowerCase(locale),
            name: init,
          };
        }

        init.locale = S.toLowerCase(init.locale ?? locale); // Set the locale to the prop if present, otherwise use the key

        return init;
      });

      locale = localeInit
        ? S.toLowerCase(localeInit) // If a locale is provided, use it
        : S.is(keys[0]) // Otherwise, use the first locale in the object
          ? keys[0].toLowerCase() // If it's a string, use it
          : S.toLowerCase(localesInit[keys[0]!]); // Otherwise, use the locale in the definition object

      locales = definitionsInit.map((l) => l.locale!.toLowerCase());
    }

    locales.unshift(locale); // Ensure the default locale is always first
    locales = [...new Set(locales.filter(S.isStrict))]; // Remove duplicates and empty strings

    return {
      locale,
      locales,
      definitionsInit,
    };
  })() satisfies {
    locale: Locale; // Default locale
    locales: Locale[]; // Ordered allowlist of locales
    definitionsInit: LocaleDefinitionInit[]; // Definitions for each locale yet not converted to `LocaleDefinition`
  };

  return {
    locale,
    locales: definitionsInit.reduce(
      (acc, init) => {
        const currentLocale = init.locale
          ? S.toLowerCase(init.locale)
          : S.toSnakeCase(init.name);

        // If there's no locale nor name, locale will be an empty string. We can't have that as a key.
        if (!currentLocale) {
          throw new Error(
            `Translations: A locale definition must include either a locale or a name.`,
          );
        }

        acc[currentLocale] = getLocaleDefinition(
          init,
          locale !== currentLocale ? locales : undefined, // will return `false` for the default locale (which can't fallback)
        );

        return acc;
      },
      {} as Record<Locale, LocaleDefinition>,
    ),
  };
}

function getLocaleDefinition(
  init: LocaleDefinitionInit | Locale,
  locales: Locale[] | undefined,
): LocaleDefinition {
  if (S.is(init)) {
    const locale = S.toLowerCase(init);

    return {
      locale: locale,
      name: locale,
      fallback: locales ? locales.filter((l) => l !== locale) : undefined,
    };
  }

  if (!init.locale) {
    throw new Error(`Translations: A locale definition must include a locale.`);
  }

  return {
    locale: init.locale,
    name: init.name ?? init.locale,
    fallback: (() => {
      if (Array.isArray(init.fallback)) {
        const fallback = [
          ...new Set(
            init.fallback.map(S.toLowerCase).filter((l) => l !== init.locale),
          ),
        ];

        return fallback.length ? fallback : undefined;
      }

      if (init.fallback === undefined || init.fallback === true) {
        return locales && locales.filter((l) => l !== init.locale);
      }

      if (S.is(init.fallback)) {
        if (init.fallback === init.locale) {
          console.warn(
            `Translations: A locale cannot fallback to itself: "${init.locale}".`,
          );

          return undefined;
        }

        return [init.fallback];
      }

      return undefined;
    })(),
  };
}
