import { expect, test, jest } from '@jest/globals';
import { AtomsElement, createElement, createPage, html, render, number, boolean, string, array, object, unsafeHTML, css, classMap } from './index.js';

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
    __global__: {
      html: {
        fontSize: '16px',
      },
    },
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
  expect(styles.render()).toEqual(`
  html {
    font-size: 16px;

  }


.button-1t9ijgh {
  color: magenta;
  font-size: 10px;

  @media screen and (min-width:40em) {
    font-size: 64px;

  }
  :hover {
    color: black;

  }
  @media screen and (min-width:56em) {

    :hover {
      color: navy;

    }
  }
}

.container-1dvem0h {
  flex: 1;
  align-items: center;
  justify-content: center;

}

`);
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
  expect(res).toEqual(`
    <div>
      <app-counter name="123" class="abc high" age="1" details1="{'name':'123','address':{'street':'1'}}" items="[1,2,3]"></app-counter>
    </div>
  `);
});

test('render attribute keys', async () => {
  const template = html`
    <div>
      <app-counter name="123" perPage="1"></app-counter>
    </div>
  `;
  const res = await render(template);
  expect(res).toEqual(`
    <div>
      <app-counter name="123" perPage="1"></app-counter>
    </div>
  `);
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
  expect(res).toEqual(`
    <div>
      <app-counter name="123" class="high" age="1" details1="{'name':'123','address':{'street':'1'}}" items="[1,2,3]"></app-counter>
    </div>
  `);
});

test('render unsafeHTML', async () => {
  const textContent = `<div><p class="123">this is unsafe</p></div>`;
  const template = html` <div>${unsafeHTML(textContent)}</div> `;
  const res = await render(template);
  expect(res).toEqual(` <div><div><p class="123">this is unsafe</p></div></div> `);
});

test('render classMap show', async () => {
  const hide = false;
  const template = html` <div class="abc ${classMap({ show: !hide })}"></div> `;
  const res = await render(template);
  expect(res).toEqual(` <div class="abc show"></div> `);
});

test('render classMap hide', async () => {
  const hide = true;
  const template = html` <div class="abc ${classMap({ show: !hide })}"></div> `;
  const res = await render(template);
  expect(res).toEqual(` <div class="abc "></div> `);
});

test('render single template', async () => {
  const template = html` <div>${html`NoCountry ${false}`}</div> `;
  const res = await render(template);
  expect(res).toEqual(` <div>NoCountry false</div> `);
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
  expect(res).toEqual(`
    <div>
      
          <app-item meta="{'index':1}">
            <button>+</button>
          </app-item>
        
          <app-item meta="{'index':2}">
            <button>+</button>
          </app-item>
        
    </div>
  `);
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
  const instance = new AppItem([
    { name: 'address', value: JSON.stringify({ street: '123' }).replace(/"/g, `'`) },
    { name: 'perpage', value: '1' },
  ]);
  instance.renderItem = () => html`<div><p>render item 1</p></div>`;
  expect(AppItem.observedAttributes).toEqual(['perpage', 'address']);
  const res = instance.renderTemplate();
  expect(res).toEqual(`
          
        <div perPage="1">
          <p>street: 123</p>
          <p>count: 0</p>
          <p>sum: 10</p>
          <div><p>render item 1</p></div>
        </div>
      
          <style>
          .div-1gao8uk {
  color: red;

}


          </style>
        `);
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
  expect(res).toEqual(` <div></div> `);
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
  const res = renderPage({ config: { lang: 'en', title: '123' }, headScript: scripts, bodyScript: scripts });
  expect(res).toEqual(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=5.0, shrink-to-fit=no">
          <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
          <link rel="icon" type="image/png" href="/assets/icon.png" />

      <title>123</title>
      <meta name="title" content="123">
      <meta name="description" content="123">

          <style>
            .div-1gao8uk {
  color: red;

}

          </style>
          <script type="module"><script>
        </head>
        <body>

      <div>
        <app-header></app-header>
        <main class="flex flex-1 flex-col mt-20 items-center">
          <h1 class="text-5xl">123</h1>
        </main>
      </div>

          <script>
            window.__DEV__ = true;
            window.config = {"lang":"en","title":"123"};
            window.data = undefined;
            window.item = undefined;
          </script>
          <script type="module"><script>
        </body>
      </html>
  `);
});
