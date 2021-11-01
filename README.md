# effector-when.macro
Simple macros which wraps your `clocks` with specified guard

## What is it?
Let's say we have some settings modal window.  
It's attached to a **statically** created model, and we'd like to connect this modal to **multiple** places.
So, we need all our connections to work only when we called window from a specific place.
That'd be a log of boilerplate - you need a lot of `guard` wrappers etc.
This babel macro does this work for you

## Installation

```bash
npm install effector-when.macro
```

Don't forget to add `babel-plugin-macros`:

```bash
npm i babel-plugin-macros -D
```

And `.babelrc`

```json
{
  "plugins": ["babel-plugin-macros"]
}
```

## Usage

```tsx
import when from "babel-plugin-macros";
import { $options, settingsOpened, settingsClosed } from "@/settings-modal";

const currentSettingsOpened = createEvent();

const $isOpened = createStore(false);
const $currentOptions = createStore({ foo: "bar" });

$isOpened
  .on(currentSettingsOpened, () => true);

when($isOpened, () => { 
  $isOpened
    .on(settingsClosed, () => false);

  $currentOptions
    .on($options, (prev, next) => next);
});
```
Converts to:
```tsx
import when from "babel-plugin-macros";
import { $options, settingsOpened, settingsClosed } from "@/settings-modal";

const currentSettingsOpened = createEvent();

const $isOpened = createStore(false);
const $currentOptions = createStore({ foo: "bar" });

$isOpened
  .on(currentSettingsOpened, () => true);

$isOpened
  .on(guard({ 
    clock: settingsClosed, 
    filter: $isOpened 
  }), () => false);

$currentOptions
  .on(guard({
    clock: $options,
    filter: \$isOpened
  }), (prev, next) => next);
});
```

## Supported operators
```tsx
when($isOpened, () => {
  forward({
    from,
    to
  });

  sample({
    source,
    target
  });

  guard({
    source,
    target
  });

  $store
    .on($foo, callback)
});
```
Converts to
```tsx
forward({
  from: guard({ clock: from, filter: $isOpened }),
  to
});

sample({
  source: guard({ clock: source, filter: $isOpened }),
  target
});

guard({
  source: guard({ clock: source, filter: $isOpened }),
  target
});

$store
  .on(guard({ clock: $foo, filter: $isOpened }), callback)
```
