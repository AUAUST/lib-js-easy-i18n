###### AUAUST LIBRARIES — JavaScript — easy-i18n

> This repository is made public to open the codebase to contributors.
> When contributing to this repo, you agree to assign your copyrights to AUAUST.

# easy-i18n

`easy-i18n` is a simple, lightweight, isomorphic, and framework-agnostic internationalisation library for JavaScript.
It's a minimal core library that only provides the well-known `t()` function, and an augmentation API that provides the required hooks to make it work with YOUR app.

## Overview

```js
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

t("myNamespace:helloName", { args: { name: "Mrs. Norris" } }); // => "Hello Mrs. Norris"
```

## Motivation

There are many internationalisation libraries out there, all of which have great features and definitely have powerful use cases. However, we couldn't find a library that was simple enough to provide a great developer experience, flexible and easy enough to be usable in any project, and flexible yet powerful enough to be used in larger applications. We also wanted the ability to strongly type our translations.

The most popular libraries, notably [`i18next`](https://www.i18next.com), are massive beasts that are based on huge plugin ecosystems and require long documentation reads to get started. Setting them up in a project is often a pain and making them work on implementations that don't match their assumptions is complicated at best.

[`typesafe-i18n`](https://github.com/ivanhofer/typesafe-i18n) does provide full type safety, which is undeniably great for larger projects and DX, but their method of getting translations by accessing properties on objects makes it difficult to implement dynamic keys. [They also explicitly discourage the use of fallback strategies](https://github.com/ivanhofer/typesafe-i18n#how-can-i-use-my-base-translation-as-a-fallback-for-other-locales) which we believe to be a must-have for any internationalisation library. Fully translating an application in every locale is ideal but rarely realistic; falling backi to other locales is definitely not great, but also definitely better than falling back to nothing at all. Their implementation is also bound to storing translations in TypeScript files, which is acceptable for small projects but rarely feasible in real-world applications.

Another paradigm that is implemented by most libraries is "templating languages." This is something we never really understood. A templating language requires you to learn a new syntax, which is often convoluted and that can only handle a limited set of use cases. It'll never be as powerful as JavaScript, and will definitely never be as performant. We always found it easier to implement tiny functions as the translation instead of implementing a whole templating language.

What we wanted was a library that had the same level of type safety as `typesafe-i18n`, the same powerful features as `i18next`, the convenience of a simple `t()` function, the possibility to translate with functions and more flexibility than any library we could find. For that, we went to the whiteboard and started setting up the requirements for our ideal internationalisation library. `easy-i18n` is the result of that.

## Key Features

- **Type Safety** – Strongly or loosely typed. You choose your DX.
- **Framework Agnostic** – Works with any framework (or no framework at all). It's only a function that returns a string, in the end.
- **Easy to configure** - You can start straight away by only passing a default locale and its translations and it'll work out of the box. You can go as far as configuring the fallback strategy and syntax.
- **Easy to use** – Straightforward and minimalistic API.
- **Robust** – Simple low-level JavaScript. No magic in the runtime code. Nothing but magic on the type system.
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

The library revolves around the `Translations` class. You initialise an instance with your configuration, then use its `t()` method to translate your strings.

### Initialization

You have a few ways of initialising the `Translations` class, all of which are equivalent:

```js
const config: TranslationsInit = { ... };

const easyI18n = await Translations.init(config);
const easyI18n = await new Translations(config).init();
```

## Sponsor

This library is a project by us, [AUAUST](https://auaust.ch/). We sponsor ourselves!
