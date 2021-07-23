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
    .default((attrs) => attrs.meta?.start || 0)
    .action('increment', ({ state }) => state.setCount(state.count + 1))
    .action('decrement', ({ state }) => state.setCount(state.count - 1)),
});

const computedTypes = () => ({
  sum: number()
    .required()
    .compute('count', (count) => {
      return count + 10;
    }),
  warningClass: string()
    .required()
    .compute('count', (count) => {
      return count > 10 ? 'text-red-500' : '';
    }),
});

const render = ({ attrs, state, computed }) => {
  const { name, meta } = attrs;
  const { count, increment, decrement } = state;
  const { sum, warningClass } = computed;

  return html`
    <div>
      <div class="mb-2">
        Counter: ${name}
        <span>starts at ${meta?.start}</span>
      </div>
      <div class="flex flex-1 flex-row items-center text-gray-700">
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${decrement}>-</button>
        <div class="mx-20">
          <h1 class="text-3xl font-mono ${warningClass}">${count}</h1>
        </div>
        <button class="bg-gray-300 text-gray-700 rounded hover:bg-gray-200 px-4 py-2 text-3xl focus:outline-none" @click=${increment}>+</button>
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
