import { defineElement, html, object, number, string, useState } from '../src/index.js';
import { ssr } from '../src/ssr.js';

const attrTypes = {
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

defineElement('app-counter', Counter, attrTypes);

console.log(ssr(html`<app-counter name="1"></app-counter>`));
