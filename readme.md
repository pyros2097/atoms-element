# atoms-element

[![Version](https://img.shields.io/npm/v/atoms-element?style=flat-square&color=blue)](https://www.npmjs.com/package/atoms-element)

A simple web component library for defining your custom elements. It works on both client and server. It supports hooks and follows the same
principles of react. Props are attributes on the custom element by default so its easier to debug.

It uses slightly modified versions of these libraries,

1. [lit-html](https://github.com/lit/lit) on the client
2. [lit-html-server](https://github.com/popeindustries/lit-html-server) on the server
3. [fuco](https://github.com/wtnbass/fuco)

## Installation

```sh
npm i atoms-element
```

## Usage

```js
import { defineElement, html, render, number } from 'atoms-element.js';

const propTypes = {
  name: string.isRequired,
};

const Counter = ({ name }) => {
  const [count, setCount] = useState(0);

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

render(html`<app-counter name="1"></app-counter>`, document.body);
```
