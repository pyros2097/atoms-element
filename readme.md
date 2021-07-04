# atoms-element

[![Version](https://img.shields.io/npm/v/atoms-element?style=flat-square&color=blue)](https://www.npmjs.com/package/atoms-element)
![Test](https://github.com/pyros2097/atoms-element/actions/workflows/main.yml/badge.svg)

A simple web component library for defining your custom elements. It works on both client and server. It supports hooks and follows the same
principles of react. Data props are attributes on the custom element by default so its easier to debug and functions/handlers are
methods attached to the element.

It uses slightly modified versions of these libraries,

1. [lit-html](https://github.com/lit/lit)
2. [fuco](https://github.com/wtnbass/fuco)

## Installation

```sh
npm i atoms-element
```

## Usage

```js
import { defineElement, html, render, object, number, string } from 'atoms-element';

const propTypes = {
  name: string.isRequired,
  meta: object({
    start: number,
  }),
};

const Counter = ({ name, meta }) => {
  const [count, setCount] = useState(meta?.start || 0);

  return html`
    <div>
      <div class="font-bold mb-2">Counter: ${name}</div>
      <div class="flex flex-1 flex-row text-3xl text-gray-700">
        <button @click=${() => setCount((v) => v - 1)}>-</button>
        <div class="mx-20">
          <h1 class="text-1xl">${count}</h1>
        </div>
        <button @click=${() => setCount((v) => v + 1)}>+</button>
      </div>
    </div>
  `;
};

defineElement('app-counter', Counter, propTypes);

console.log(render(html`<app-counter name="1"></app-counter>`));
```
