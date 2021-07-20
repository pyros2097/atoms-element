import { html, css } from '../element.js';
import createPage from '../page.js';
import './app-counter.js';

const route = () => {
  return '/counter';
};

const styles = () => css({});

const head = ({ config }) => {
  return html`
    <title>${config.title}</title>
    <link href="/modern-normalize.css" rel="stylesheet" as="style" />
  `;
};

const body = () => {
  return html`
    <div>
      <app-counter name="1" meta="{'start': 5}"></app-counter>
    </div>
  `;
};

export default createPage({
  route,
  styles,
  head,
  body,
});
