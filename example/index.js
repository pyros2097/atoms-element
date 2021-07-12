import AtomsElement, { html, object, number, string } from '../element.js';
import Page from '../page.js';

class Counter extends AtomsElement {
  static name = 'app-counter';

  static attrTypes = {
    name: string.isRequired,
    meta: object({
      start: number,
    }),
  };

  static styles = `
    .container {
    }
  `;

  render() {
    const { name, meta } = this.getAttrs();
    const [count, setCount] = this.useState(meta?.start || 0);

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
  }
}

Counter.register();

console.log(ssr(html`<app-counter name="1"></app-counter>`));
