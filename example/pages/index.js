import { createPage, html } from '../../index.js';
import '../elements/app-counter.js';
import '../elements/app-total.js';

const head = ({ config }) => {
  return html` <title>${config.title}</title> `;
};

const body = () => {
  return html`
    <div class="flex flex-1 flex-col items-center justify-center">
      <app-counter name="1" meta="{'start': 5}"></app-counter>
      <app-counter name="2" meta="{'start': 7}"></app-counter>
      </div class="mt-10">
        <app-total></app-total>
      </div>
    </div>
  `;
};

export default createPage({
  head,
  body,
});
