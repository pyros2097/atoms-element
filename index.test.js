import { expect, test, jest } from '@jest/globals';
import { getElement, createElement, createPage, createState, html, renderHtml, unsafeHTML, css, compileTw } from './index.js';

global.__DEV = true;

test('css', () => {
  const styles = css({
    button: {
      color: 'magenta',
      fontSize: '10px',
      '@media screen and (min-width:40em)': {
        fontSize: '64px',
      },
      ':hover': {
        color: 'black',
      },
      '@media screen and (min-width:56em)': {
        ':hover': {
          color: 'navy',
        },
      },
    },
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
  expect(styles).toMatchSnapshot();
});

test('compileTw', () => {
  expect(compileTw('text-white font-bold border border-black p-4 m-4 w-20 h-20'.split(' '))).toMatchSnapshot();
});

test('renderHtml', async () => {
  const age = 1;
  const data = { name: '123', address: { street: '1' } };
  const items = [1, 2, 3];
  const highlight = 'high';
  const template = html`
    <div>
      <app-counter name="123" class="abc ${highlight}" age=${age} details1=${data} items=${items}></app-counter>
    </div>
  `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('render attribute keys', async () => {
  const template = html`
    <div>
      <app-counter name="123" perPage="1"></app-counter>
    </div>
  `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('render attributes within quotes', async () => {
  const age = 1;
  const data = { name: '123', address: { street: '1' } };
  const items = [1, 2, 3];
  const classes = 'high';
  const template = html`
    <div>
      <app-counter name="123" class=${classes} age="${age}" details1="${data}" items="${items}"></app-counter>
    </div>
  `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('render unsafeHTML', async () => {
  const textContent = `<div><p class="123">this is unsafe</p></div>`;
  const template = html` <div>${unsafeHTML(textContent)}</div> `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('render single template', async () => {
  const template = html` <div>${html`NoCountry ${false}`}</div> `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('render multi template', async () => {
  const template = html`
    <div>
      ${[1, 2].map(
        (v) => html`
          <app-item meta="${{ index: v }}" @click=${() => {}} .handleClick=${() => {}}>
            <button @click=${() => {}}>+</button>
          </app-item>
        `,
      )}
    </div>
  `;
  const res = await renderHtml(template);
  expect(res).toMatchSnapshot();
});

test('createState', () => {
  const countState = createState({
    state: {
      count: 0,
    },
    reducer: {
      increment: (state, a) => ({ ...state, count: state.count + a }),
      decrement: (state, a) => ({ ...state, count: state.count - a }),
    },
  });
  const mock = jest.fn();
  countState.subscribe(mock);
  countState.increment(4);
  expect(countState.getValue().count).toEqual(4);
  expect(mock).toBeCalledWith({ count: 4 });
  countState.decrement(1);
  expect(countState.getValue().count).toEqual(3);
  expect(mock).toBeCalledWith({ count: 3 });
  countState.decrement(2);
  expect(countState.getValue().count).toEqual(1);
  expect(mock).toBeCalledWith({ count: 1 });
});

test('createElement without attrs and state', async () => {
  createElement({
    name: 'base-element',
    render: () => {
      return html` <div></div> `;
    },
  });
  const Clazz = getElement('base-element');
  const instance = new Clazz();
  const res = instance.render();
  expect(res).toMatchSnapshot();
});

test('createElement with attrs and state', async () => {
  createElement({
    name: 'base-element',
    attrs: {
      perPage: '',
    },
    state: {
      count: 3,
    },
    reducer: {
      setValue: (state, v) => ({ ...state, count: v }),
    },
    render: ({ attrs, state, actions }) => {
      const { perPage } = attrs;
      const { count } = state;

      return html`
        <div>
          <div>
            <span>perPage: ${perPage}</span>
          </div>
          </div>
              <span>Count: ${count}</span>
          </div>
          <button @click=${actions.setValue}>Set</button>
        </div>
      `;
    },
  });
  const Clazz = getElement('base-element');
  const instance = new Clazz({ perPage: 5 });
  const res = instance.render();
  expect(Clazz.observedAttributes).toEqual(['perpage']);
  expect(res).toMatchSnapshot();
});

test('createPage', () => {
  const route = () => {
    const langPart = this.config.lang === 'en' ? '' : `/${this.config.lang}`;
    return `${langPart}`;
  };
  const head = ({ config }) => {
    return html`
      <title>${config.title}</title>
      <meta name="title" content=${config.title} />
      <meta name="description" content=${config.title} />
    `;
  };

  const body = ({ config }) => {
    return html`
      <div>
        <app-header></app-header>
        <main class="flex flex-1 flex-col mt-20 items-center">
          <h1 class="text-5xl">${config.title}</h1>
        </main>
      </div>
    `;
  };
  const renderPage = createPage({
    route,
    head,
    body,
  });
  const scripts = '<script type="module"><script>';
  const res = renderPage({ lang: 'en', props: { config: { title: '123' } }, headScript: scripts, bodyScript: scripts });
  expect(res).toMatchSnapshot();
});
