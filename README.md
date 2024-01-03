###### AUAUST LIBRARIES — JavaScript — easy-i18n

> This repository is made public to open the codebase to contributors.
> When contributing to this repo, you agree to assign your copyrights to AUAUST.

# easy-i18n

`easy-i18n` is a simple, lightweight, isomorphic, and framework-agnostic internationalization library for JavaScript.
It's a mininal core library that only provides the well-known `t()` function, and an augmentation API that provides the required hooks to make it work with YOUR app.

## Overview

```tsx
import { Translations } from "@auaust/easy-i18n";

const easyI18n = await Translations.init({
  locales: {
    default: "en",
  },
  // namespaces: {
  //   default: "myNamespace",
  // },
  translations: {
    en: {
      myNamespace: {
        hello: "Hello",
        helloName: (props: { name: string }) => `Hello ${props.name}`,
      },
    },
  },
});

const { t } = easyI18n;

t("myNamespace:hello"); // => "Hello"
t("hello", { ns: "myNamespace" }); // => "Hello"

// If you set the default namespace:
t("hello"); // => "Hello"

t("myNamespace:helloName", { arg: { name: "Mrs. Norris" } }); // => "Hello Mrs. Norris"
```

## Motivation

There are many internationalization libraries out there, all of which have great features and definitely have powerful use cases.However, we couldn't find a library that was type-safe and simple enough to provide a great developer experience, flexible and easy enough to be usable in any project, and flexible yet powerful enough to be used in larger applications.

For example [`typesafe-i18n`](https://github.com/ivanhofer/typesafe-i18n) does provide full type safety, which is undeniably great for larger projects and DX, but their way of getting translations by accessing actual properties on objects makes it complicated to implement dynamic keys. [They also explicitly discourage the use of fallbacking strategies](https://github.com/ivanhofer/typesafe-i18n#how-can-i-use-my-base-translation-as-a-fallback-for-other-locales) which we believe to be a must-have for any internationalization library. Fully translating an application in every locale is the ideal but is rarely realistic; fallbacking to other locales is definitely not great, but also definitely better than fallbacking to nothing at all. Their implementation is also hand-tied to storing translations in TypeScript files, which is OK for small projects but almost never realistic in real-world applications.

The most popular libraries, notably [`i18next`](https://www.i18next.com), are massive beasts that are based on huge plugins ecosystems and requires long documentation reads to get started. Setting them up in a project is often a pain and making them work on implementations that don't match their assumptions is complicated at best.

Another paradigm that is implemented by most libraries are "templating languages". This is something we never really understood. A templating language requires you to learn a new syntax, often convoluted, that can only handle a limited set of use cases. It'll never be as powerful as JavaScript, and will definitely never be as performant. We always found it easier to implement tiny functions as the translation instead of implementing a whole templating language.

What we wanted a library that had the same level of type safety as `typesafe-i18n`, the same powerful features as `i18next`, the convenience of a simple `t()` function, the possibility to translation with functions and more flexibility than any library we could find. For that we went to the whiteboard and started setting up the requirements for our ideal internationalization library. `easy-i18n` is the result of that.

## Key Features

- **Type Safety** – Strongly typed. Or loosely typed. You choose your DX.
- **Framework Agnostic** – Works with any framework (or no framework at all). It's only a function that returns a string, in the end.
- **Easy to configure** - You can start straight away by only passing a default locale and its translations and it'll work out of the box. You can go as far as configuring the fallbacking strategy and syntax.
- **Easy to use** – Straightforward and minimalistic API.
- **Robust** – Simple low-level JavaScript. No magic on the runtime code. Nothing but magic on the type system.
- **Runtime safe** – 0 runtime error guarantee. With strong types, it's hard to make mistakes. If you do, the worst that can happen is you get an empty string.
- **Isomorphic** – Can run in any JavaScript environment. Was even tested in InDesign's scripting environment. (Yes, we're serious.)

## Installation

```sh
yarn add @auaust/easy-i18n
```

or if you prefer Bun:

```sh
bun add @auaust/easy-i18n
```

## Usage

The library revolves around the `Translations` class. You initialize an instance with your configuration, then use its `t()` method to translate your strings.

### Initialization

You have a few ways of initializing the `Translations` class, all of which are equivalent:

```tsx
const config: TranslationsInit = { ... };

const easyI18n = await Translations.init(config);
const easyI18n = await new Translations(config).init();
```

## Sponsor

This library is a project by us, [AUAUST](https://auaust.ch/). We sponsor ourselves!
