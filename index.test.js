import { expect, test, jest } from '@jest/globals';
import { AtomsElement, createElement, createPage, createState, html, render, number, boolean, string, array, object, unsafeHTML, css } from './index.js';

global.__DEV = true;

const primitives = [
  {
    type: 'number',
    valid: [123, 40.5, 6410],
    invalid: ['123', false, {}, [], new Date()],
  },
  {
    type: 'boolean',
    valid: [false, true],
    invalid: ['123', 123, {}, [], new Date()],
  },
  {
    type: 'string',
    valid: ['', '123'],
    invalid: [123, false, {}, [], new Date()],
  },
];
const primitiveTypes = {
  number: number,
  boolean: boolean,
  string: string,
};

primitives.forEach((value) =>
  it(`${value.type}`, () => {
    const spy = jest.spyOn(global.console, 'warn').mockImplementation();
    const context = 'key';
    const validator = primitiveTypes[value.type]();
    const validatorReq = primitiveTypes[value.type]().required();
    expect(validator.type).toEqual(value.type);
    expect(validator.__required).toEqual(undefined);
    expect(validatorReq.__required).toEqual(true);
    validator.validate(context);
    for (const v of value.valid) {
      validator.validate(context, v);
      validatorReq.validate(context, v);
    }
    validatorReq.validate(context);
    expect(console.warn).toHaveBeenCalledWith(`'key' Field is required`);
    for (const v of value.invalid) {
      validator.validate(context, v);
      expect(console.warn).toHaveBeenCalledWith(`'key' Expected type '${value.type}' got type '${typeof v}'`);
    }
    spy.mockRestore();
  }),
);

test.only('createState', () => {
  // computed: {
  //     sum: (state, v) => state.count + v,
  //   },
  const countState = createState({
    state: {
      count: 0,
    },
    reducer: {
      increment: (state, a) => ({ ...state, count: state.count + a }),
      decrement: (state, a) => ({ ...state, count: state.count - a }),
    },
  });
  createElement({
    name: 'hello',
    attrs: {
      name: '123',
    },
    state: countState,
    render: ({ attrs, state, actions }) => {
      console.log('attrs', attrs);
    },
  });
  // countState.subscribe((v) => {
  //   console.log(v);
  // });
  // countState.increment(4);
  // console.log(countState.sum(21));
  // countState.decrement(1);
  // console.log(countState.sum(21));
  // countState.decrement(2);
  // console.log(countState.sum(21));
});

test('object', () => {
  const spy = jest.spyOn(global.console, 'warn').mockImplementation();
  const context = 'data';
  object({}).validate(context, { name: '123' });
  object({ name: string() }).validate(context, { name: '123' });
  object({ name: string().required() }).validate(context, { name: '' });
  object({ name: string().required() }).validate(context, {});
  expect(console.warn).toHaveBeenCalledWith(`'data.name' Field is required`);

  const schema = object({
    address: object({
      street: string(),
    }),
  });
  schema.validate(context, {});
  schema.validate(context, '123');
  expect(console.warn).toHaveBeenCalledWith(`'data' Expected object literal '{}' got 'string'`);
  schema.validate(context, {
    address: {},
  });
  schema.validate(context, {
    address: '123',
  });
  expect(console.warn).toHaveBeenCalledWith(`'data.address' Expected object literal '{}' got 'string'`);
  schema.validate(context, {
    address: {
      street: 'avenue 1',
    },
  });
  schema.validate(context, {
    address: {
      street: false,
    },
  });
  expect(console.warn).toHaveBeenCalledWith(`'data.address.street' Expected type 'string' got type 'boolean'`);

  const schema2 = object({
    address: object({
      street: string().required(),
    }),
  });
  schema2.validate(context, {});
  schema2.validate(context, {
    address: {
      street: '11th avenue',
    },
  });
  schema2.validate(context, {
    address: {},
  });
  expect(console.warn).toHaveBeenCalledWith(`'data.address.street' Field is required`);
  spy.mockRestore();
});

test('array', () => {
  const spy = jest.spyOn(global.console, 'warn').mockImplementation();
  const context = 'items';
  array(string()).validate(context, ['123']);
  array(string()).validate(context, [123]);
  expect(console.warn).toHaveBeenCalledWith(`'items[0]' Expected type 'string' got type 'number'`);
  array(array(string())).validate(context, [['123']]);
  array(array(string())).validate(context, [[123]]);
  expect(console.warn).toHaveBeenCalledWith(`'items[0][0]' Expected type 'string' got type 'number'`);

  const schema = object({
    street: string().required(),
  });
  array(schema).validate(context, []);
  array(schema).validate(context, [{ street: '123' }, { street: '456' }, { street: '789' }]);
  array(schema).validate(context, [{}]);
  expect(console.warn).toHaveBeenCalledWith(`'items[0].street' Field is required`);
  array(schema).validate(context, [{ street: false }]);
  expect(console.warn).toHaveBeenCalledWith(`'items[0].street' Expected type 'string' got type 'boolean'`);
  array(schema).validate(context, [{ street: '123' }, {}]);
  expect(console.warn).toHaveBeenCalledWith(`'items[1].street' Field is required`);
  array(schema).validate(context, [{ street: '123' }, { street: false }]);
  expect(console.warn).toHaveBeenCalledWith(`'items[1].street' Expected type 'string' got type 'boolean'`);
  spy.mockRestore();
});

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

test('render', async () => {
  const age = 1;
  const data = { name: '123', address: { street: '1' } };
  const items = [1, 2, 3];
  const highlight = 'high';
  const template = html`
    <div>
      <app-counter name="123" class="abc ${highlight}" age=${age} details1=${data} items=${items}></app-counter>
    </div>
  `;
  const res = await render(template);
  expect(res).toMatchSnapshot();
});

test('render attribute keys', async () => {
  const template = html`
    <div>
      <app-counter name="123" perPage="1"></app-counter>
    </div>
  `;
  const res = await render(template);
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
  const res = await render(template);
  expect(res).toMatchSnapshot();
});

test('render unsafeHTML', async () => {
  const textContent = `<div><p class="123">this is unsafe</p></div>`;
  const template = html` <div>${unsafeHTML(textContent)}</div> `;
  const res = await render(template);
  expect(res).toMatchSnapshot();
});

test('render single template', async () => {
  const template = html` <div>${html`NoCountry ${false}`}</div> `;
  const res = await render(template);
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
  const res = await render(template);
  expect(res).toMatchSnapshot();
});

test('AtomsElement', async () => {
  class AppItem extends AtomsElement {
    static name = 'app-item';

    static attrTypes = {
      perPage: string().required(),
      address: object({
        street: string().required(),
      }).required(),
    };

    static stateTypes = {
      count: number().required().default(0),
    };

    static computedTypes = {
      sum: number()
        .required()
        .compute('count', (count) => {
          return count + 10;
        }),
    };

    static styles = css({
      div: {
        color: 'red',
      },
    });

    render() {
      const {
        perPage,
        address: { street },
      } = this.attrs;
      const { count, setCount } = this.state;
      const { sum } = this.computed;
      return html`
        <div perPage=${perPage}>
          <p>street: ${street}</p>
          <p>count: ${count}</p>
          <p>sum: ${sum}</p>
          ${this.renderItem()}
        </div>
      `;
    }
  }
  AppItem.register();
  const Clazz = AtomsElement.getElement('app-item');
  expect(Clazz.name).toEqual(AppItem.name);
  const instance = new AppItem({
    address: { street: '123' },
    perPage: '1',
  });
  instance.renderItem = () => html`<div><p>render item 1</p></div>`;
  expect(AppItem.observedAttributes).toEqual(['perpage', 'address']);
  const res = instance.renderTemplate();
  expect(res).toMatchSnapshot();
});

test('createElement ', async () => {
  createElement({
    name: () => 'base-element',
    render: () => {
      return html` <div></div> `;
    },
  });
  const Clazz = AtomsElement.getElement('base-element');
  const instance = new Clazz();
  const res = instance.renderTemplate();
  expect(res).toMatchSnapshot();
});

test('Page', () => {
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
