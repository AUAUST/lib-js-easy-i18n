import type { Translation } from "~/types/translations";

export function isTranslation(value: any): value is Translation {
  switch (typeof value) {
    case "string":
    case "function":
    case "number": // While not officially supported, it makes no arm to support numbers.
      return true;
    default:
      return false;
  }
}
