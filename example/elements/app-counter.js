import { createElement, html, useReducer } from '../../index.js';
import { totalReducer } from '../store.js';

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
  const increment = () => {
    actions.increment();
    totalReducer.actions.increment(count + 1);
  };
  const decrement = () => {
    actions.decrement();
    totalReducer.actions.decrement(count - 1);
  };
  const warningClass = count > 10 ? 'text-red-500' : '';

  return html`
    <div class="mt-10">
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
    </div>
  `;
};

export default createElement(import.meta, Counter);
