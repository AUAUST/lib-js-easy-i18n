import type { WellKnownNamespaces } from "~/types/config";
import type { PickProperty } from "~/types/store";
import type { Namespace, NestedTranslationsRecord } from "~/types/translations";

/**
 * A generic object of translations you should use to validate your default locale's translations.
 * It's ensure your translations are valid (as in, they're all strings or functions that return strings).
 *
 * @example ```ts
 * import { type BaseTranslations } from "@auaust/easy-i18n";
 *
 * export default {
 *   my: "My",
 *   nested: {
 *     translation: "Nested Translation",
 *     translationFunction: (props: { name: string }) => `Hello ${props.name}!`
 *   }
 * } as const satisfies BaseTranslations;
 * ```
 */
type BaseTranslations = NestedTranslationsRecord;

/**
 * A generic type that allows you to easily add new translations to your app based on the structure of your default locale.
 * It'll ensure your new locale has the same translations as your default locale.
 *
 * You must use this type by passing it a registered namespace. If the namespace you pass isn't well typed, you'll still get minimal type validation, but not structural validation.
 *
 * @example ```ts
 * // Assuming you extended the `RegisteredTranslations` interface to add your own namespaces:
 * declare module "@auaust/easy-i18n" {
 *   export interface RegisteredTranslations {
 *     global: typeof globalTranslations;
 *   }
 * }
 *
 * import { type TranslationsTemplate } from "@auaust/easy-i18n";
 *
 * export default {
 *   my: "Mein",
 *   nested: {
 *     translation: "Verschachtelte Übersetzung",
 *     translationFunction: (props: { name: string }) => `Hallo ${props.name}!`
 *  }
 * } as const satisfies TranslationsTemplate<"global">;
 * ```
 */
type TranslationsTemplate<N extends Namespace> = N extends WellKnownNamespaces
  ? PickProperty<N, "generic">
  : NestedTranslationsRecord;

export type { BaseTranslations, TranslationsTemplate };
