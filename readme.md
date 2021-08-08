# atoms-element

[![Version](https://img.shields.io/npm/v/atoms-element?style=flat-square&color=blue)](https://www.npmjs.com/package/atoms-element)
![Test](https://github.com/pyros2097/atoms-element/actions/workflows/main.yml/badge.svg)

A simple web component library for defining your custom elements. It works on both client and server. It supports hooks and follows the same principles of react.
Data props are attributes on the custom element by default so its easier to debug and functions/handlers are attached to the element.

I initially started researching if it was possible to server render web components but found out not one framework supported it. I liked using
[haunted](https://github.com/matthewp/haunted) as it was react-like with hooks but was lost on how to implement server rendering. Libraries like
JSDOM couldn't be of use since it didn't support web components and I didn't want to use puppeteer for something like this.

After a year of thinking about it and researching it I found out this awesome framework [Tonic](https://github.com/optoolco/tonic).
That was the turning point I figured out how they implemented it using a simple html parser.

After going through all these libraries,

1. [lit-html](https://github.com/lit/lit)
2. [lit-html-server](https://github.com/popeindustries/lit-html-server)
3. [haunted](https://github.com/matthewp/haunted)
4. [Tonic](https://github.com/optoolco/tonic)
5. [Atomico](https://github.com/atomicojs/atomico)
6. [fuco](https://github.com/wtnbass/fuco)

And figuring out how each one implemented their on custom elements I came up with atoms-element. It still doesn't have proper rehydration lit-html just replaces the DOM under the server rendered web component for now. Atomico has implemented proper SSR with hydration so I might need to look into that in the future or
use it instead of lit-html. Since I made a few modifications like json attributes and attrTypes I don't know if it will easy.

## Installation

```sh
npm i atoms-element
```

## Example

```js
import { createElement, useReducer, html, renderHtml } from 'atoms-element/index.js';

const Counter = ({ name, meta }) => {
  const { count, actions } = useReducer({
    initial: {
      count: 0,
    },
    reducer: {
      increment: (state) => ({ ...state, count: state.count + 1 }),
      decrement: (state) => ({ ...state, count: state.count - 1 }),
    },
  });
  const warningClass = count > 10 ? 'text-red-500' : '';
  return html`
    <div class="mt-10">
      <div class="mb-2">
        Counter: ${name}
        <span>starts at ${meta?.start}</span>
      </div>
      <div class="flex flex-1 flex-row items-center text-gray-700">
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${actions.decrement}>-</button>
        <div class="mx-20">
          <h1 class="text-3xl font-mono ${warningClass}">${count}</h1>
        </div>
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${actions.increment}>+</button>
      </div>
    </div>
  `;
};

createElement({ url: 'app-counter.js' }, Counter);

console.log(renderHtml(html`<app-counter name="1"></app-counter>`));
```
