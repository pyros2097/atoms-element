import { createPage, html, css } from '../index.js';
import { pageStyles } from './styles.js';
import './app-counter.js';

const head = ({ config }) => {
  return html`
    <title>${config.title}</title>
    <style>
      ${css(pageStyles)}
    </style>
  `;
};

const body = () => {
  return html`
    <div class="flex flex-1 items-center justify-center">
      <app-counter name="1" meta="{'start': 5}"></app-counter>
    </div>
  `;
};

export default createPage({
  head,
  body,
});
