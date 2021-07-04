import { expect, test, jest } from '@jest/globals';
import {
  html,
  render,
  number,
  boolean,
  string,
  array,
  object,
  setLogError,
  defineElement,
  getElement,
  useConfig,
  useLocation,
  useState,
} from '../src/index.js';

const logMock = jest.fn();
setLogError(logMock);

const expectError = (msg) => expect(logMock).toHaveBeenCalledWith(msg);

const primitives = [
  {
    type: 'number',
    validator: number,
    valid: [123, 40.5, 6410],
    invalid: ['123', false, {}, [], new Date()],
  },
  {
    type: 'boolean',
    validator: boolean,
    valid: [false, true],
    invalid: ['123', 123, {}, [], new Date()],
  },
  {
    type: 'string',
    validator: string,
    valid: ['', '123'],
    invalid: [123, false, {}, [], new Date()],
  },
];

primitives.forEach((value) =>
  it(`${value.type}`, () => {
    const context = 'key';
    expect(value.validator.type).toEqual(value.type);
    expect(value.validator.isRequired.type).toEqual(value.type);
    value.validator.validate(context);
    for (const v of value.valid) {
      value.validator.validate(context, v);
      value.validator.isRequired.validate(context, v);
    }
    value.validator.isRequired.validate(context);
    expectError(`'key' Field is required`);
    for (const v of value.invalid) {
      value.validator.validate(context, v);
      expectError(`'key' Expected type '${value.type}' got type '${typeof v}'`);
    }
  }),
);

test('object', () => {
  const context = 'data';
  object({}).validate(context, { name: '123' });
  object({ name: string }).validate(context, { name: '123' });
  object({ name: string.isRequired }).validate(context, { name: '' });
  object({ name: string.isRequired }).validate(context, {});
  expectError(`'data.name' Field is required`);

  const schema = object({
    address: object({
      street: string,
    }),
  });
  schema.validate(context, {});
  schema.validate(context, '123');
  expectError(`'data' Expected object literal '{}' got 'string'`);
  schema.validate(context, {
    address: {},
  });
  schema.validate(context, {
    address: '123',
  });
  expectError(`'data.address' Expected object literal '{}' got 'string'`);
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
  expectError(`'data.address.street' Expected type 'string' got type 'boolean'`);

  const schema2 = object({
    address: object({
      street: string.isRequired,
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
  expectError(`'data.address.street' Field is required`);
});

test('array', () => {
  const context = 'items';
  array(string).validate(context, ['123']);
  array(string).validate(context, [123]);
  expectError(`'items[0]' Expected type 'string' got type 'number'`);
  array(array(string)).validate(context, [['123']]);
  array(array(string)).validate(context, [[123]]);
  expectError(`'items[0][0]' Expected type 'string' got type 'number'`);

  const schema = object({
    street: string.isRequired,
  });
  array(schema).validate(context, []);
  array(schema).validate(context, [{ street: '123' }, { street: '456' }, { street: '789' }]);
  array(schema).validate(context, [{}]);
  expectError(`'items[0].street' Field is required`);
  array(schema).validate(context, [{ street: false }]);
  expectError(`'items[0].street' Expected type 'string' got type 'boolean'`);
  array(schema).validate(context, [{ street: '123' }, {}]);
  expectError(`'items[1].street' Field is required`);
  array(schema).validate(context, [{ street: '123' }, { street: false }]);
  expectError(`'items[1].street' Expected type 'string' got type 'boolean'`);
});

test('useConfig', async () => {
  expect(useConfig()).toBe(undefined);
  global.config = {};
  expect(useConfig()).toMatchObject({});
});

test('useLocation', async () => {
  expect(useLocation()).toBe(undefined);
  global.location = {};
  expect(useLocation()).toMatchObject({});
});

test('render', async () => {
  const data = { name: '123', address: { street: '1' } };
  const template = html`
    <div>
      <app-counter name="123" details="${data}"></app-counter>
    </div>
  `;
  const res = await render(template);
  expect(res).toEqual(`
    <div>
      <app-counter name=\"123\" details=\"{'name':'123','address':{'street':'1'}}\"></app-counter>
    </div>
  `);
});

test('render single template', async () => {
  const template = html` <div>${html`NoCountry ${false}`}</div> `;
  const res = await render(template);
  expect(res).toEqual(` <div>NoCountry false</div> `);
});

test('render multu template', async () => {
  const template = html` <div>${[1, 2].map((v) => html` <app-item meta="${{ index: v }}" @click=${() => {}} .handleClick=${() => {}}></app-item>`)}</div> `;
  const res = await render(template);
  expect(res).toEqual(
    ` <div> <app-item meta="{'index':1}" @click=undefined .handleClick=undefined></app-item> <app-item meta="{'index':2}" @click=undefined .handleClick=undefined></app-item></div> `,
  );
});

test('defineElement', async () => {
  const attrTypes = {
    address: object({
      street: string.isRequired,
    }).isRequired,
  };
  const AppItem = ({ address: { street } }) => {
    const [count] = useState(0);
    return html`
      <div>
        <p>street: ${street}</p>
        <p>count: ${count}</p>
      </div>
    `;
  };
  defineElement('app-item', AppItem, attrTypes);
  const { clazz } = getElement('app-item');
  const instance = new clazz([{ name: 'address', value: JSON.stringify({ street: '123' }).replace(/"/g, `'`) }]);
  const res = await instance.render();
  expect(res).toEqual(`
      <div>
        <p>street: 123</p>
        <p>count: 0</p>
      </div>
    `);
});
