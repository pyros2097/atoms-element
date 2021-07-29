import { createElement, createState, html } from '../index.js';

export default createElement({
  name: 'app-counter',
  attrs: {
    name: '',
    meta: {
      start: '',
    },
  },
  state: {
    count: 0,
  },
  reducer: {
    increment: (state) => ({ ...state, count: state.count + 1 }),
    decrement: (state) => ({ ...state, count: state.count - 1 }),
  },
  render: ({ attrs, state, actions }) => {
    const { name, meta } = attrs;
    const { count } = state;
    const sum = count + 10;
    const warningClass = count > 10 ? 'text-red-500' : '';

    return html`
      <div>
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
        <div class="mx-20">
          <h1 class="text-xl font-mono">Sum: ${sum}</h1>
        </div>
      </div>
    `;
  },
});
