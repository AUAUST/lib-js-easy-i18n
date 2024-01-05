export type Stringifiable = string | number | boolean | null | undefined;

export type IsInterfaceEmpty<T> = keyof T extends never ? true : false;

export type NestedRecord<K extends PropertyKey, T> = {
  [key in K]: T | NestedRecord<K, T>;
};

export type Flatten<T extends any[]> = T extends [infer Head, ...infer Rest]
  ? Head extends any[]
    ? [...Flatten<Head>, ...Flatten<Rest>]
    : [Head, ...Flatten<Rest>]
  : T;

export type Join<
  T extends any[],
  S extends Stringifiable,
> = Flatten<T> extends [infer First, ...infer Rest]
  ? Rest extends Stringifiable[]
    ? `${First & Stringifiable}${Rest extends [] ? "" : `${S}${Join<Rest, S>}`}`
    : never
  : "";

export type Split<
  Target extends string,
  Separator extends string,
> = Target extends `${infer FirstPart}${Separator}${infer Rest}`
  ? [FirstPart, ...Split<Rest, Separator>]
  : [Target];

export type DeepEndValues<T, FilterType = any> = T extends object
  ? { [K in keyof T]: DeepEndValues<T[K], FilterType> }[keyof T]
  : T extends FilterType
    ? T
    : never;
