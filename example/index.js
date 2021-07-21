import { html, css } from '../element.js';
import { createPage } from '../page.js';
import { __global__ } from './styles.js';
import './app-counter.js';

const route = () => {
  return '/counter';
};

const styles = css({
  __global__,
  center: {
    display: 'flex',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const head = ({ config }) => {
  return html` <title>${config.title}</title> `;
};

const body = () => {
  return html`
    <div class=${styles.center}>
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
