import { createElement, html, object, number, string, unsafeHTML } from '../index.js';

const name = () => 'app-counter';

const attrTypes = () => ({
  name: string().required(),
  meta: object({
    start: number(),
  }),
});

const stateTypes = () => ({
  count: number()
    .required()
    .default((attrs) => attrs.meta?.start || 0),
});

const computedTypes = () => ({
  sum: number()
    .required()
    .compute('count', (count) => {
      return count + 10;
    }),
});

const render = ({ attrs, state, computed }) => {
  const { name, meta } = attrs;
  const { count, setCount } = state;
  const { sum } = computed;

  return html`
    <div>
      <div class="mb-2">
        Counter: ${name}
        <span>starts at ${meta?.start}</span>
      </div>
      <div class="flex flex-1 flex-row items-center text-gray-700">
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${() => setCount((v) => v - 1)}>
          -
        </button>
        <div class="mx-20">
          <h1 class="text-2xl font-mono">${count < 10 ? unsafeHTML('&nbsp;') : ''}${count}</h1>
        </div>
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${() => setCount((v) => v + 1)}>
          +
        </button>
      </div>
      <div class="mx-20">
        <h1 class="text-xl font-mono">Sum: ${sum}</h1>
      </div>
    </div>
  `;
};

export default createElement({
  name,
  attrTypes,
  stateTypes,
  computedTypes,
  render,
});
