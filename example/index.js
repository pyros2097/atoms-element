import { html, css } from '../element.js';
import Page from '../page.js';
import './app-counter.js';

class CounterPage extends Page {
  route() {
    return '/counter';
  }

  styles() {
    return css``;
  }

  head({ config }) {
    return html` <title>${config.title}</title> `;
  }

  body() {
    return html`
      <div>
        <app-counter name="1"></app-counter>
      </div>
    `;
  }
}

const counterPage = new CounterPage({ config: { lang: 'en', title: 'Counter App' } });
console.log(counterPage.render());
