import { createElement, html, useReducer } from '../../index.js';
import { totalReducer } from '../store.js';

const Total = () => {
  const { total } = useReducer(totalReducer);
  return html`
    <div class="m-20">
      <h1 class="text-xl font-mono">Total of 2 Counters: ${total}</h1>
    </div>
  `;
};

export default createElement(import.meta, Total);
