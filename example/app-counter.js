import AtomsElement, { html, css, object, number, string } from '../element.js';

class Counter extends AtomsElement {
  static name = 'app-counter';

  static attrTypes = {
    name: string.isRequired,
    meta: object({
      start: number,
    }),
  };

  static styles = css`
    .container {
    }
  `;

  render() {
    const { name, meta } = this.attrs;
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
